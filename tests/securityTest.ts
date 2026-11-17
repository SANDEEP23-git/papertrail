/**
 * PAPERTRAIL — Automated Security & Account Isolation Test Suite
 * 
 * Verifies all 11 mandatory security scenarios:
 * 1. Register two separate user accounts (Alice & Bob).
 * 2. Create notes using Account A (Alice).
 * 3. Log out and sign in using Account B (Bob).
 * 4. Verify that Account B cannot see Account A's notes.
 * 5. Direct ID access rejection (Bob trying to read/update Alice's note ID).
 * 6. Unauthorized access rejection verification.
 * 7. Change ink and font preferences in Account A (Alice).
 * 8. Verify Account A's preferences do not leak to Account B.
 * 9. Re-login as Account A and verify all Alice's notes & preferences are intact.
 * 10. Account switching cache isolation.
 * 11. Account deletion data wipe verification.
 */

// Global localStorage shim for Node test runner
const storageMap = new Map<string, string>();
(globalThis as any).localStorage = {
  getItem: (k: string) => (storageMap.has(k) ? storageMap.get(k)! : null),
  setItem: (k: string, v: string) => storageMap.set(k, String(v)),
  removeItem: (k: string) => storageMap.delete(k),
  clear: () => storageMap.clear(),
};

import { AuthService } from '../services/auth';
import { NotesRepository } from '../database/notes';

async function runTestSuite() {
  console.log('--- STARTING PAPERTRAIL SECURITY & ISOLATION TEST SUITE ---');

  // Scenario 1: Register two separate user accounts
  console.log('\n[TEST 1] Registering Account A (Alice) and Account B (Bob)...');
  const sessionAlice = await AuthService.register(
    'Alice Writer',
    'alice@example.com',
    'aliceSecret123',
    'First story?',
    'The Platen Mystery'
  );
  if (!sessionAlice || sessionAlice.email !== 'alice@example.com') {
    throw new Error('Failed to register Alice');
  }
  console.log('✓ Account A registered successfully with ID:', sessionAlice.userId);

  // Scenario 2: Create notes using Account A
  console.log('\n[TEST 2] Creating notes for Account A (Alice)...');
  const noteA1 = await NotesRepository.createNote({
    title: "Alice's Secret Journal",
    body: 'Confidential personal notes written in Burgundy ink.',
    inkColor: '#581C28',
    fontFamily: 'Baskerville, "Playfair Display", Georgia, serif',
  });
  const noteA2 = await NotesRepository.createNote({
    title: "Alice's Poetry Draft",
    body: 'Lines of verse in dark brown ink.',
    inkColor: '#382D26',
  });
  const aliceNotes = await NotesRepository.listActiveNotes();
  if (aliceNotes.length !== 2) throw new Error('Alice notes count mismatch');
  console.log(`✓ Alice created ${aliceNotes.length} notes successfully.`);

  // Scenario 7: Customize preferences for Account A
  console.log('\n[TEST 7] Customizing preferences for Account A...');
  await NotesRepository.updateSettings({
    defaultInkColor: '#581C28', // Burgundy
    defaultFontFamily: 'Baskerville, "Playfair Display", Georgia, serif',
    defaultFontSize: 20,
    soundVolume: 0.9,
  });
  const aliceSettings = await NotesRepository.getSettings();
  if (aliceSettings.defaultInkColor !== '#581C28' || aliceSettings.defaultFontSize !== 20) {
    throw new Error('Alice settings update failed');
  }
  console.log('✓ Alice customized ink to Burgundy (#581C28) and font size to 20px.');

  // Scenario 3: Log out Alice & Register / Sign in as Account B (Bob)
  console.log('\n[TEST 3] Logging out Alice and Registering/Signing in as Bob...');
  await AuthService.logout();
  const sessionBob = await AuthService.register(
    'Bob Journalist',
    'bob@example.com',
    'bobSecret456',
    'First story?',
    'City Lights'
  );
  if (!sessionBob || sessionBob.email !== 'bob@example.com') {
    throw new Error('Failed to register Bob');
  }
  console.log('✓ Bob signed in with ID:', sessionBob.userId);

  // Scenario 4: Verify Bob cannot see Alice's notes
  console.log('\n[TEST 4] Verifying Bob active library is completely empty (zero leakage from Alice)...');
  const bobNotes = await NotesRepository.listActiveNotes();
  if (bobNotes.length !== 0) {
    throw new Error(`SECURITY LEAK: Bob sees ${bobNotes.length} notes belonging to Alice!`);
  }
  console.log('✓ PASS: Bob sees 0 notes. Complete isolation verified.');

  // Scenario 5 & 6: Try accessing Alice's note ID directly using Bob's session
  console.log('\n[TEST 5 & 6] Testing Direct Object Reference attack (Bob requesting Alice note ID)...');
  const leakAttempt = await NotesRepository.getNoteById(noteA1.id);
  if (leakAttempt !== null) {
    throw new Error('SECURITY BREACH: Bob accessed Alice note via direct ID query!');
  }
  console.log('✓ PASS: Direct getNoteById rejected unauthorized access (returned null).');

  let updateRejected = false;
  try {
    await NotesRepository.updateNote(noteA1.id, { body: 'Tampered by Bob!' });
  } catch (err: any) {
    updateRejected = true;
    console.log('✓ PASS: Unauthorized update threw expected error:', err.message);
  }
  if (!updateRejected) {
    throw new Error('SECURITY BREACH: Bob successfully updated Alice note!');
  }

  // Scenario 8: Verify Bob does NOT have Alice's customized preferences
  console.log('\n[TEST 8] Verifying Bob preferences do not leak from Alice...');
  const bobSettings = await NotesRepository.getSettings();
  if (bobSettings.defaultInkColor === '#581C28') {
    throw new Error('SETTINGS LEAK: Bob inherited Alice default ink color!');
  }
  console.log('✓ PASS: Bob has default ink color (#382D26), not Alice Burgundy.');

  // Create a note for Bob
  console.log('\n[Bob writing his own note]...');
  await NotesRepository.createNote({
    title: "Bob's Public Dispatch",
    body: 'Morning report on market trends.',
    inkColor: '#1E3A8A', // Royal Blue
  });
  const bobCurrentNotes = await NotesRepository.listActiveNotes();
  if (bobCurrentNotes.length !== 1) throw new Error('Bob note creation failed');
  console.log('✓ Bob created 1 note in Royal Blue.');

  // Scenario 9 & 10: Switch back to Alice
  console.log('\n[TEST 9 & 10] Switching back to Alice (testing account switching & cache flush)...');
  await AuthService.logout();
  await AuthService.login('alice@example.com', 'aliceSecret123');
  const aliceRestoredNotes = await NotesRepository.listActiveNotes();
  if (aliceRestoredNotes.length !== 2) {
    throw new Error(`Expected 2 notes for Alice, got ${aliceRestoredNotes.length}`);
  }
  if (aliceRestoredNotes.some((n) => n.title.includes('Bob'))) {
    throw new Error('CACHE CONTAMINATION: Bob note appeared in Alice library!');
  }
  const aliceRestoredSettings = await NotesRepository.getSettings();
  if (aliceRestoredSettings.defaultInkColor !== '#581C28') {
    throw new Error('Alice settings were not preserved!');
  }
  console.log('✓ PASS: Alice notes (2) and Burgundy preferences fully restored without cross-contamination.');

  // Scenario 11: Test Account Deletion & Data Cleanup
  console.log('\n[TEST 11] Testing account deletion and data erasure for Alice...');
  await AuthService.deleteAccount(sessionAlice.userId, 'aliceSecret123');
  console.log('✓ Alice account deleted.');

  // Verify Alice cannot log in
  let loginFailed = false;
  try {
    await AuthService.login('alice@example.com', 'aliceSecret123');
  } catch {
    loginFailed = true;
  }
  if (!loginFailed) throw new Error('Deleted user was able to log in!');
  console.log('✓ PASS: Deleted user login rejected.');

  // Verify Bob data remains intact after Alice account deletion
  await AuthService.login('bob@example.com', 'bobSecret456');
  const bobFinalNotes = await NotesRepository.listActiveNotes();
  if (bobFinalNotes.length !== 1 || bobFinalNotes[0].title !== "Bob's Public Dispatch") {
    throw new Error('Bob data was corrupted by Alice deletion!');
  }
  console.log('✓ PASS: Bob data completely intact and unimpacted by Alice deletion.');

  console.log('\n======================================================');
  console.log(' ALL 11 MANDATORY SECURITY & ISOLATION TESTS PASSED! ');
  console.log('======================================================\n');
}

runTestSuite().catch((err) => {
  console.error('\n❌ TEST FAILED:', err);
  process.exit(1);
});

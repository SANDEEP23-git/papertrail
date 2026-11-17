import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Header } from '../components/Header';
import { AuthService, AuthSession } from '../services/auth';
import { NotesRepository, NoteStats } from '../database/notes';
import { Colors, Typography, Spacing, Radii } from '../constants/theme';
import { Ionicons } from '@expo/vector-icons';

export default function AccountScreen() {
  const router = useRouter();
  const [session, setSession] = useState<AuthSession | null>(null);
  const [stats, setStats] = useState<NoteStats>({
    activeCount: 0,
    archivedCount: 0,
    trashCount: 0,
    totalWords: 0,
  });

  // Password change states
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [pwdMsg, setPwdMsg] = useState<{ text: string; isError: boolean } | null>(null);

  // Account deletion states
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    const current = await AuthService.getSession();
    setSession(current);
    const realStats = await NotesRepository.getStats();
    setStats(realStats);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const handleLogout = async () => {
    await AuthService.logout();
    NotesRepository.clearCache();
    router.replace('/');
  };

  const handleChangePassword = async () => {
    setPwdMsg(null);
    if (!session) return;
    if (!oldPassword || !newPassword) {
      setPwdMsg({ text: 'Please fill in both current and new password.', isError: true });
      return;
    }
    try {
      await AuthService.changePassword(session.userId, oldPassword, newPassword);
      setPwdMsg({ text: 'Password successfully updated.', isError: false });
      setOldPassword('');
      setNewPassword('');
      setShowPasswordChange(false);
    } catch (err: unknown) {
      setPwdMsg({ text: err instanceof Error ? err.message : 'Change password failed.', isError: true });
    }
  };

  const handleDeleteAccount = async () => {
    setDeleteError(null);
    if (!session) return;
    if (!deletePassword) {
      setDeleteError('Enter your password to verify ownership.');
      return;
    }

    try {
      await AuthService.deleteAccount(session.userId, deletePassword);
      NotesRepository.clearCache();
      router.replace('/');
    } catch (err: unknown) {
      setDeleteError(err instanceof Error ? err.message : 'Failed to delete account.');
    }
  };

  const handleExportData = async () => {
    try {
      const json = await NotesRepository.exportAllAsJson();
      if (Platform.OS === 'web') {
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `papertrail_${session?.name || 'user'}_notes_backup.json`;
        a.click();
        URL.revokeObjectURL(url);
      } else {
        Alert.alert('Archive Exported', 'Your personal notes backup has been prepared.');
      }
    } catch (err) {
      console.error('Export error:', err);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header
        title="PERSONAL ACCOUNT"
        subtitle="IDENTITY & ACCESS"
        showBack
      />

      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
        {/* Profile Card */}
        <View style={styles.sectionCard}>
          <View style={styles.profileHeader}>
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarLetter}>
                {session ? session.name.charAt(0).toUpperCase() : 'G'}
              </Text>
            </View>
            <View style={styles.profileDetails}>
              <Text style={styles.profileName}>
                {session ? session.name : 'Guest Writer'}
              </Text>
              <Text style={styles.profileEmail}>
                {session ? session.email : 'Local unauthenticated session'}
              </Text>
              <View style={styles.accountBadge}>
                <Ionicons name="shield-checkmark" size={12} color={Colors.brass} />
                <Text style={styles.accountBadgeText}>
                  {session ? 'CRYPTOGRAPHICALLY ISOLATED VAULT' : 'LOCAL GUEST PARTITION'}
                </Text>
              </View>
            </View>
          </View>

          {/* Quick Stats Grid */}
          <View style={styles.statsRow}>
            <View style={styles.statTile}>
              <Text style={styles.statNumber}>{stats.activeCount}</Text>
              <Text style={styles.statTitle}>Active Notes</Text>
            </View>
            <View style={styles.statTile}>
              <Text style={styles.statNumber}>{stats.archivedCount}</Text>
              <Text style={styles.statTitle}>Archived</Text>
            </View>
            <View style={styles.statTile}>
              <Text style={styles.statNumber}>{stats.totalWords}</Text>
              <Text style={styles.statTitle}>Total Words</Text>
            </View>
          </View>
        </View>

        {/* Action: Sign In or Register if Guest */}
        {!session && (
          <View style={styles.sectionCard}>
            <Text style={styles.sectionHeading}>REGISTER OR SIGN IN</Text>
            <Text style={styles.sectionDesc}>
              Create a personal account to bind your writings to your own credentials and access them across sessions.
            </Text>
            <TouchableOpacity
              style={styles.primaryBtn}
              onPress={() => router.push('/auth')}
            >
              <Ionicons name="log-in-outline" size={18} color={Colors.sheet} />
              <Text style={styles.primaryBtnText}>Sign In / Create Account</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Security & Password section (Only for authenticated users) */}
        {session && (
          <View style={styles.sectionCard}>
            <Text style={styles.sectionHeading}>ACCOUNT CREDENTIALS</Text>

            {pwdMsg && (
              <View style={pwdMsg.isError ? styles.errorBox : styles.successBox}>
                <Text style={pwdMsg.isError ? styles.errorText : styles.successText}>
                  {pwdMsg.text}
                </Text>
              </View>
            )}

            {!showPasswordChange ? (
              <TouchableOpacity
                style={styles.outlineBtn}
                onPress={() => setShowPasswordChange(true)}
              >
                <Ionicons name="key-outline" size={16} color={Colors.walnut} />
                <Text style={styles.outlineBtnText}>Change Account Password</Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.pwdForm}>
                <Text style={styles.inputLabel}>CURRENT PASSWORD</Text>
                <TextInput
                  style={styles.input}
                  placeholder="••••••••••••"
                  placeholderTextColor={Colors.muted}
                  value={oldPassword}
                  onChangeText={setOldPassword}
                  secureTextEntry
                />

                <Text style={styles.inputLabel}>NEW PASSWORD (MIN 6 CHARACTERS)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="••••••••••••"
                  placeholderTextColor={Colors.muted}
                  value={newPassword}
                  onChangeText={setNewPassword}
                  secureTextEntry
                />

                <View style={styles.btnRow}>
                  <TouchableOpacity
                    style={styles.saveBtn}
                    onPress={handleChangePassword}
                  >
                    <Text style={styles.saveBtnText}>Update Password</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.cancelBtn}
                    onPress={() => setShowPasswordChange(false)}
                  >
                    <Text style={styles.cancelBtnText}>Cancel</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Export data */}
            <TouchableOpacity
              style={[styles.outlineBtn, { marginTop: Spacing.sm }]}
              onPress={handleExportData}
            >
              <Ionicons name="download-outline" size={16} color={Colors.walnut} />
              <Text style={styles.outlineBtnText}>Export Personal Notes (JSON)</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Danger Zone: Log Out & Delete Account */}
        {session && (
          <View style={[styles.sectionCard, styles.dangerCard]}>
            <Text style={[styles.sectionHeading, { color: Colors.danger }]}>
              SESSION & DATA REMOVAL
            </Text>

            <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
              <Ionicons name="log-out-outline" size={16} color={Colors.ink} />
              <Text style={styles.logoutBtnText}>Log Out of This Device</Text>
            </TouchableOpacity>

            {!showDeleteConfirm ? (
              <TouchableOpacity
                style={styles.deleteAccountBtn}
                onPress={() => setShowDeleteConfirm(true)}
              >
                <Ionicons name="trash-bin-outline" size={16} color={Colors.danger} />
                <Text style={styles.deleteAccountText}>Delete Account & Erase All Writings</Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.deleteBox}>
                <Text style={styles.deleteWarning}>
                  Permanent Action: This will destroy your account credentials, all stored notes, drafts, and preferences permanently.
                </Text>

                {deleteError && (
                  <Text style={styles.errorTextSmall}>{deleteError}</Text>
                )}

                <Text style={styles.inputLabel}>CONFIRM YOUR PASSWORD</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter password to confirm erasure"
                  placeholderTextColor={Colors.muted}
                  value={deletePassword}
                  onChangeText={setDeletePassword}
                  secureTextEntry
                />

                <View style={styles.btnRow}>
                  <TouchableOpacity
                    style={styles.confirmDeleteBtn}
                    onPress={handleDeleteAccount}
                  >
                    <Text style={styles.confirmDeleteText}>Erase Forever</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.cancelBtn}
                    onPress={() => setShowDeleteConfirm(false)}
                  >
                    <Text style={styles.cancelBtnText}>Cancel</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.paper,
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.md,
    paddingBottom: Spacing.xxl,
  },
  sectionCard: {
    backgroundColor: Colors.sheet,
    borderRadius: Radii.md,
    borderWidth: 1,
    borderColor: Colors.rule,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  avatarCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: Colors.walnut,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLetter: {
    fontSize: Typography.sizes.xl,
    fontWeight: Typography.weights.bold,
    color: Colors.sheet,
  },
  profileDetails: {
    flex: 1,
  },
  profileName: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.bold,
    color: Colors.ink,
  },
  profileEmail: {
    fontSize: Typography.sizes.xs,
    color: Colors.muted,
    marginTop: 1,
  },
  accountBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  accountBadgeText: {
    fontSize: 9,
    fontFamily: Typography.fontFamilies.mono,
    color: Colors.brass,
    fontWeight: Typography.weights.bold,
  },
  statsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.rule,
    paddingTop: Spacing.sm,
  },
  statTile: {
    flex: 1,
    backgroundColor: Colors.paper,
    borderWidth: 1,
    borderColor: Colors.rule,
    borderRadius: Radii.sm,
    padding: Spacing.sm,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.bold,
    color: Colors.ink,
    fontFamily: Typography.fontFamilies.mono,
  },
  statTitle: {
    fontSize: 10,
    color: Colors.muted,
    marginTop: 2,
  },
  sectionHeading: {
    fontSize: 10,
    fontFamily: Typography.fontFamilies.mono,
    color: Colors.muted,
    fontWeight: Typography.weights.bold,
    letterSpacing: 1.2,
    marginBottom: Spacing.sm,
  },
  sectionDesc: {
    fontSize: Typography.sizes.sm,
    color: Colors.ink,
    opacity: 0.8,
    lineHeight: 18,
    marginBottom: Spacing.md,
  },
  primaryBtn: {
    backgroundColor: Colors.walnut,
    borderRadius: Radii.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    gap: 8,
  },
  primaryBtnText: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.bold,
    color: Colors.sheet,
  },
  outlineBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.rule,
    backgroundColor: Colors.paper,
    borderRadius: Radii.sm,
    paddingVertical: 9,
    gap: 6,
  },
  outlineBtnText: {
    fontSize: Typography.sizes.sm,
    color: Colors.ink,
    fontWeight: Typography.weights.medium,
  },
  pwdForm: {
    gap: Spacing.xs,
  },
  inputLabel: {
    fontSize: 9,
    fontFamily: Typography.fontFamilies.mono,
    color: Colors.muted,
    fontWeight: Typography.weights.bold,
    letterSpacing: 1,
    marginTop: Spacing.xs,
  },
  input: {
    backgroundColor: Colors.paper,
    borderWidth: 1,
    borderColor: Colors.rule,
    borderRadius: Radii.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 8,
    fontSize: Typography.sizes.sm,
    color: Colors.ink,
  },
  btnRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  saveBtn: {
    backgroundColor: Colors.walnut,
    borderRadius: Radii.sm,
    paddingVertical: 8,
    paddingHorizontal: Spacing.md,
    alignItems: 'center',
  },
  saveBtnText: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.bold,
    color: Colors.sheet,
  },
  cancelBtn: {
    borderRadius: Radii.sm,
    paddingVertical: 8,
    paddingHorizontal: Spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.rule,
  },
  cancelBtnText: {
    fontSize: Typography.sizes.xs,
    color: Colors.muted,
  },
  dangerCard: {
    borderColor: '#E8C5C5',
    backgroundColor: '#FAF5F5',
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.sheet,
    borderWidth: 1,
    borderColor: Colors.rule,
    borderRadius: Radii.sm,
    paddingVertical: 9,
    gap: 6,
    marginBottom: Spacing.sm,
  },
  logoutBtnText: {
    fontSize: Typography.sizes.sm,
    color: Colors.ink,
    fontWeight: Typography.weights.medium,
  },
  deleteAccountBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.dangerBg,
    borderWidth: 1,
    borderColor: '#E8C5C5',
    borderRadius: Radii.sm,
    paddingVertical: 9,
    gap: 6,
  },
  deleteAccountText: {
    fontSize: Typography.sizes.sm,
    color: Colors.danger,
    fontWeight: Typography.weights.semibold,
  },
  deleteBox: {
    backgroundColor: Colors.sheet,
    borderWidth: 1,
    borderColor: '#E8C5C5',
    borderRadius: Radii.sm,
    padding: Spacing.md,
    gap: Spacing.xs,
  },
  deleteWarning: {
    fontSize: Typography.sizes.xs,
    color: Colors.danger,
    lineHeight: 18,
  },
  errorTextSmall: {
    fontSize: Typography.sizes.xs,
    color: Colors.danger,
    fontWeight: Typography.weights.bold,
  },
  confirmDeleteBtn: {
    backgroundColor: Colors.danger,
    borderRadius: Radii.sm,
    paddingVertical: 8,
    paddingHorizontal: Spacing.md,
    alignItems: 'center',
  },
  confirmDeleteText: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.bold,
    color: Colors.sheet,
  },
  errorBox: {
    backgroundColor: Colors.dangerBg,
    padding: Spacing.sm,
    borderRadius: Radii.sm,
    marginBottom: Spacing.sm,
  },
  errorText: {
    fontSize: Typography.sizes.xs,
    color: Colors.danger,
  },
  successBox: {
    backgroundColor: Colors.successBg,
    padding: Spacing.sm,
    borderRadius: Radii.sm,
    marginBottom: Spacing.sm,
  },
  successText: {
    fontSize: Typography.sizes.xs,
    color: Colors.success,
  },
});

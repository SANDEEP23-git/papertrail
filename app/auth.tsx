import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Header } from '../components/Header';
import { AuthService } from '../services/auth';
import { Colors, Typography, Spacing, Radii } from '../constants/theme';
import { Ionicons } from '@expo/vector-icons';

type AuthMode = 'login' | 'register' | 'forgot';

export default function AuthScreen() {
  const router = useRouter();
  const [mode, setMode] = useState<AuthMode>('login');

  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [securityQuestion, setSecurityQuestion] = useState('What was the title of your first story?');
  const [securityAnswer, setSecurityAnswer] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleLogin = async () => {
    setErrorMessage(null);
    setSuccessMessage(null);
    if (!email || !password) {
      setErrorMessage('Please enter both email and password.');
      return;
    }

    try {
      setLoading(true);
      await AuthService.login(email, password);
      router.replace('/');
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Login failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    setErrorMessage(null);
    setSuccessMessage(null);
    if (!name || !email || !password) {
      setErrorMessage('Please fill in all required fields.');
      return;
    }
    if (password.length < 6) {
      setErrorMessage('Password must be at least 6 characters.');
      return;
    }

    try {
      setLoading(true);
      await AuthService.register(name, email, password, securityQuestion, securityAnswer);
      router.replace('/');
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    setErrorMessage(null);
    setSuccessMessage(null);
    if (!email || !securityAnswer || !newPassword) {
      setErrorMessage('Please fill in email, security answer, and new password.');
      return;
    }

    try {
      setLoading(true);
      await AuthService.resetPasswordWithAnswer(email, securityAnswer, newPassword);
      setSuccessMessage('Password reset successfully. You can now sign in.');
      setMode('login');
      setPassword('');
      setNewPassword('');
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Reset failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header
        title="ACCOUNT ACCESS"
        subtitle="AUTHENTICATED WRITING VAULT"
        showBack
      />

      <KeyboardAvoidingView
        style={styles.keyboardContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
          {/* Paper Dossier Card */}
          <View style={styles.authCard}>
            <View style={styles.stampHeader}>
              <View style={styles.brassDot} />
              <Text style={styles.stampTitle}>PAPERTRAIL SECURITY DISPATCH</Text>
            </View>

            <Text style={styles.cardHeading}>
              {mode === 'login'
                ? 'Sign In to Your Platen'
                : mode === 'register'
                ? 'Register Personal Account'
                : 'Reset Account Password'}
            </Text>
            <Text style={styles.cardSubtitle}>
              {mode === 'login'
                ? 'Access your private offline-first writing library and preferences.'
                : mode === 'register'
                ? 'Create a secure account with cryptographic password hashing.'
                : 'Confirm your identity using your security recovery question.'}
            </Text>

            {/* Error / Success Notifications */}
            {errorMessage && (
              <View style={styles.errorBox}>
                <Ionicons name="alert-circle-outline" size={16} color={Colors.danger} />
                <Text style={styles.errorText}>{errorMessage}</Text>
              </View>
            )}

            {successMessage && (
              <View style={styles.successBox}>
                <Ionicons name="checkmark-circle-outline" size={16} color={Colors.success} />
                <Text style={styles.successText}>{successMessage}</Text>
              </View>
            )}

            {/* Mode: LOGIN */}
            {mode === 'login' && (
              <View style={styles.form}>
                <Text style={styles.fieldLabel}>EMAIL ADDRESS</Text>
                <TextInput
                  style={styles.input}
                  placeholder="writer@papertrail.app"
                  placeholderTextColor={Colors.muted}
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                />

                <Text style={styles.fieldLabel}>PASSWORD</Text>
                <TextInput
                  style={styles.input}
                  placeholder="••••••••••••"
                  placeholderTextColor={Colors.muted}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                />

                <TouchableOpacity
                  style={styles.submitBtn}
                  onPress={handleLogin}
                  disabled={loading}
                  activeOpacity={0.85}
                  accessibilityRole="button"
                >
                  <Text style={styles.submitBtnText}>
                    {loading ? 'Authenticating...' : 'Sign In to Writing Vault'}
                  </Text>
                  <Ionicons name="arrow-forward" size={16} color={Colors.sheet} />
                </TouchableOpacity>

                <View style={styles.switchRow}>
                  <TouchableOpacity onPress={() => setMode('forgot')}>
                    <Text style={styles.linkText}>Forgot password?</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => setMode('register')}>
                    <Text style={[styles.linkText, styles.linkBold]}>Create Account</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Mode: REGISTER */}
            {mode === 'register' && (
              <View style={styles.form}>
                <Text style={styles.fieldLabel}>FULL NAME / PEN NAME</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Eleanor Vance"
                  placeholderTextColor={Colors.muted}
                  value={name}
                  onChangeText={setName}
                />

                <Text style={styles.fieldLabel}>EMAIL ADDRESS</Text>
                <TextInput
                  style={styles.input}
                  placeholder="writer@papertrail.app"
                  placeholderTextColor={Colors.muted}
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                />

                <Text style={styles.fieldLabel}>PASSWORD (MIN 6 CHARACTERS)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="••••••••••••"
                  placeholderTextColor={Colors.muted}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                />

                <Text style={styles.fieldLabel}>SECURITY RECOVERY QUESTION</Text>
                <TextInput
                  style={styles.input}
                  value={securityQuestion}
                  onChangeText={setSecurityQuestion}
                />

                <Text style={styles.fieldLabel}>SECURITY ANSWER</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Your private answer for password recovery"
                  placeholderTextColor={Colors.muted}
                  value={securityAnswer}
                  onChangeText={setSecurityAnswer}
                />

                <TouchableOpacity
                  style={styles.submitBtn}
                  onPress={handleRegister}
                  disabled={loading}
                  activeOpacity={0.85}
                  accessibilityRole="button"
                >
                  <Text style={styles.submitBtnText}>
                    {loading ? 'Creating Account...' : 'Create Account & Bind Storage'}
                  </Text>
                  <Ionicons name="checkmark-done" size={16} color={Colors.sheet} />
                </TouchableOpacity>

                <View style={styles.switchRow}>
                  <Text style={styles.hintText}>Already registered?</Text>
                  <TouchableOpacity onPress={() => setMode('login')}>
                    <Text style={[styles.linkText, styles.linkBold]}>Sign In Here</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Mode: FORGOT PASSWORD */}
            {mode === 'forgot' && (
              <View style={styles.form}>
                <Text style={styles.fieldLabel}>YOUR ACCOUNT EMAIL</Text>
                <TextInput
                  style={styles.input}
                  placeholder="writer@papertrail.app"
                  placeholderTextColor={Colors.muted}
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                />

                <Text style={styles.fieldLabel}>SECURITY ANSWER</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter your security answer"
                  placeholderTextColor={Colors.muted}
                  value={securityAnswer}
                  onChangeText={setSecurityAnswer}
                />

                <Text style={styles.fieldLabel}>NEW PASSWORD (MIN 6 CHARACTERS)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="••••••••••••"
                  placeholderTextColor={Colors.muted}
                  value={newPassword}
                  onChangeText={setNewPassword}
                  secureTextEntry
                />

                <TouchableOpacity
                  style={styles.submitBtn}
                  onPress={handleForgotPassword}
                  disabled={loading}
                  activeOpacity={0.85}
                  accessibilityRole="button"
                >
                  <Text style={styles.submitBtnText}>
                    {loading ? 'Resetting...' : 'Reset Password & Restore Access'}
                  </Text>
                </TouchableOpacity>

                <View style={styles.switchRow}>
                  <TouchableOpacity onPress={() => setMode('login')}>
                    <Text style={styles.linkText}>← Back to Sign In</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.paper,
  },
  keyboardContainer: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.md,
    paddingBottom: Spacing.xxl,
    alignItems: 'center',
  },
  authCard: {
    width: '100%',
    maxWidth: 480,
    backgroundColor: Colors.sheet,
    borderRadius: Radii.md,
    borderWidth: 1,
    borderColor: Colors.rule,
    padding: Spacing.lg,
    marginTop: Spacing.sm,
    shadowColor: Colors.ink,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  stampHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: Spacing.sm,
  },
  brassDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.brass,
  },
  stampTitle: {
    fontSize: 9,
    fontFamily: Typography.fontFamilies.mono,
    color: Colors.brass,
    fontWeight: Typography.weights.bold,
    letterSpacing: 1.5,
  },
  cardHeading: {
    fontSize: Typography.sizes.xl,
    fontWeight: Typography.weights.bold,
    color: Colors.ink,
    fontFamily: Typography.fontFamilies.serif,
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: Typography.sizes.sm,
    color: Colors.muted,
    lineHeight: 18,
    marginBottom: Spacing.md,
  },
  form: {
    gap: Spacing.xs,
  },
  fieldLabel: {
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
    paddingHorizontal: Spacing.sm + 2,
    paddingVertical: 10,
    fontSize: Typography.sizes.sm,
    color: Colors.ink,
    fontFamily: Typography.fontFamilies.sans,
    marginBottom: Spacing.xs,
  },
  submitBtn: {
    backgroundColor: Colors.walnut,
    borderRadius: Radii.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 8,
    marginTop: Spacing.md,
  },
  submitBtnText: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.bold,
    color: Colors.sheet,
    letterSpacing: 0.5,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.md,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.rule,
  },
  linkText: {
    fontSize: Typography.sizes.xs,
    color: Colors.walnut,
  },
  linkBold: {
    fontWeight: Typography.weights.bold,
  },
  hintText: {
    fontSize: Typography.sizes.xs,
    color: Colors.muted,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.dangerBg,
    borderWidth: 1,
    borderColor: '#E8C5C5',
    borderRadius: Radii.sm,
    padding: Spacing.sm,
    marginBottom: Spacing.sm,
    gap: 6,
  },
  errorText: {
    flex: 1,
    fontSize: Typography.sizes.xs,
    color: Colors.danger,
    lineHeight: 16,
  },
  successBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.successBg,
    borderWidth: 1,
    borderColor: '#C5E8C5',
    borderRadius: Radii.sm,
    padding: Spacing.sm,
    marginBottom: Spacing.sm,
    gap: 6,
  },
  successText: {
    flex: 1,
    fontSize: Typography.sizes.xs,
    color: Colors.success,
    lineHeight: 16,
  },
});

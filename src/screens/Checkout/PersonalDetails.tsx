import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

const BRAND = '#e13e00';

type Field = 'firstName' | 'lastName' | 'email' | 'phone' | 'note';

interface FormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  note: string;
}

interface FormErrors {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
}

const PersonalDetails = () => {
  const router = useRouter();

  const [form, setForm] = useState<FormData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    note: '',
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [focused, setFocused] = useState<Field | null>(null);

  const validate = (): boolean => {
    const newErrors: FormErrors = {};

    if (!form.firstName.trim()) newErrors.firstName = 'First name is required';
    if (!form.lastName.trim()) newErrors.lastName = 'Last name is required';
    if (!form.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(form.email)) {
      newErrors.email = 'Enter a valid email';
    }
    if (!form.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!/^\+?[\d\s\-]{7,15}$/.test(form.phone)) {
      newErrors.phone = 'Enter a valid phone number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleProceed = () => {
    if (validate()) {
      router.push('/checkout/address');
    }
  };

  const handleChange = (field: Field, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
    if (errors[field as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const inputStyle = (field: Field) => [
    styles.input,
    focused === field && styles.inputFocused,
    errors[field as keyof FormErrors] && styles.inputError,
  ];

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>

        {/* Step indicator */}
        <View style={styles.stepRow}>
          {['Details', 'Address', 'Payment'].map((step, i) => (
            <React.Fragment key={step}>
              <View style={styles.stepItem}>
                <View style={[styles.stepDot, i === 0 && styles.stepDotActive]}>
                  <Text style={[styles.stepDotText, i === 0 && styles.stepDotTextActive]}>
                    {i + 1}
                  </Text>
                </View>
                <Text style={[styles.stepLabel, i === 0 && styles.stepLabelActive]}>
                  {step}
                </Text>
              </View>
              {i < 2 && <View style={[styles.stepLine, i === 0 && styles.stepLineActive]} />}
            </React.Fragment>
          ))}
        </View>

        <Text style={styles.sectionTitle}>Personal Details</Text>
        <Text style={styles.sectionSubtitle}>Tell us a bit about yourself</Text>

        {/* First & Last Name row */}
        <View style={styles.row}>
          <View style={styles.halfField}>
            <Text style={styles.label}>First Name</Text>
            <TextInput
              style={inputStyle('firstName')}
              placeholder="Juan"
              placeholderTextColor="#bbb"
              value={form.firstName}
              onChangeText={v => handleChange('firstName', v)}
              onFocus={() => setFocused('firstName')}
              onBlur={() => setFocused(null)}
              autoCapitalize="words"
            />
            {errors.firstName && <Text style={styles.error}>{errors.firstName}</Text>}
          </View>

          <View style={styles.halfField}>
            <Text style={styles.label}>Last Name</Text>
            <TextInput
              style={inputStyle('lastName')}
              placeholder="dela Cruz"
              placeholderTextColor="#bbb"
              value={form.lastName}
              onChangeText={v => handleChange('lastName', v)}
              onFocus={() => setFocused('lastName')}
              onBlur={() => setFocused(null)}
              autoCapitalize="words"
            />
            {errors.lastName && <Text style={styles.error}>{errors.lastName}</Text>}
          </View>
        </View>

        {/* Email */}
        <View style={styles.field}>
          <Text style={styles.label}>Email Address</Text>
          <TextInput
            style={inputStyle('email')}
            placeholder="juan@email.com"
            placeholderTextColor="#bbb"
            value={form.email}
            onChangeText={v => handleChange('email', v)}
            onFocus={() => setFocused('email')}
            onBlur={() => setFocused(null)}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          {errors.email && <Text style={styles.error}>{errors.email}</Text>}
        </View>

        {/* Phone */}
        <View style={styles.field}>
          <Text style={styles.label}>Phone Number</Text>
          <TextInput
            style={inputStyle('phone')}
            placeholder="+63 912 345 6789"
            placeholderTextColor="#bbb"
            value={form.phone}
            onChangeText={v => handleChange('phone', v)}
            onFocus={() => setFocused('phone')}
            onBlur={() => setFocused(null)}
            keyboardType="phone-pad"
          />
          {errors.phone && <Text style={styles.error}>{errors.phone}</Text>}
        </View>

        {/* Note */}
        <View style={styles.field}>
          <View style={styles.labelRow}>
            <Text style={styles.label}>Order Note</Text>
            <Text style={styles.optional}>Optional</Text>
          </View>
          <TextInput
            style={[inputStyle('note'), styles.textarea]}
            placeholder="Any special instructions for your order..."
            placeholderTextColor="#bbb"
            value={form.note}
            onChangeText={v => handleChange('note', v)}
            onFocus={() => setFocused('note')}
            onBlur={() => setFocused(null)}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />
        </View>

        {/* Proceed Button */}
        <TouchableOpacity style={styles.button} onPress={handleProceed} activeOpacity={0.85}>
          <Text style={styles.buttonText}>Proceed to Address</Text>
        </TouchableOpacity>

        <View style={{ height: 32 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { paddingHorizontal: 20, paddingTop: 24 },

  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 28,
  },
  stepItem: { alignItems: 'center', gap: 4 },
  stepDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepDotActive: { backgroundColor: BRAND },
  stepDotText: { fontSize: 12, fontWeight: '600', color: '#aaa' },
  stepDotTextActive: { color: '#fff' },
  stepLabel: { fontSize: 11, color: '#aaa' },
  stepLabelActive: { color: BRAND, fontWeight: '600' },
  stepLine: { flex: 1, height: 1.5, backgroundColor: '#eee', marginBottom: 14 },
  stepLineActive: { backgroundColor: BRAND },

  sectionTitle: { fontSize: 20, fontWeight: '700', color: '#111', marginBottom: 4 },
  sectionSubtitle: { fontSize: 13, color: '#888', marginBottom: 24 },

  row: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  halfField: { flex: 1 },
  field: { marginBottom: 16 },

  labelRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 },
  label: { fontSize: 13, fontWeight: '600', color: '#333', marginBottom: 6 },
  optional: { fontSize: 11, color: '#aaa' },

  input: {
    borderWidth: 1.5,
    borderColor: '#e8e8e8',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: '#111',
    backgroundColor: '#fafafa',
  },
  inputFocused: {
    borderColor: BRAND,
    backgroundColor: '#fff',
  },
  inputError: {
    borderColor: '#e53935',
    backgroundColor: '#fff9f9',
  },
  textarea: {
    height: 88,
    paddingTop: 12,
  },
  error: { fontSize: 11, color: '#e53935', marginTop: 4 },

  button: {
    backgroundColor: BRAND,
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});

export default PersonalDetails;
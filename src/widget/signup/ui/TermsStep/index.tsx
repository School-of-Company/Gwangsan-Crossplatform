import { useState, useMemo, useCallback, memo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from '@expo/vector-icons/Ionicons';
import SignupForm from '~/entity/auth/ui/SignupForm';
import { useSignupStepNavigation } from '~/entity/auth/model/useAuthSelectors';
import { router } from 'expo-router';
import { Checkbox } from '@/shared/ui/Checkbox';
import { TERMS_CONTENT } from '../../const/TERMS_CONTENT';
import { PRIVACY_CONTENT } from '../../const/PRIVACY_CONTENT';

type AgreementKey = 'terms' | 'privacy';

interface AgreementItem {
  key: AgreementKey;
  title: string;
  content: string;
}

const AGREEMENTS: AgreementItem[] = [
  { key: 'terms', title: '이용약관 동의', content: TERMS_CONTENT },
  { key: 'privacy', title: '개인정보처리방침 동의', content: PRIVACY_CONTENT },
];

function TermsStep() {
  const { nextStep, resetStore } = useSignupStepNavigation();
  const [checked, setChecked] = useState<Record<AgreementKey, boolean>>({
    terms: false,
    privacy: false,
  });
  const [viewingKey, setViewingKey] = useState<AgreementKey | null>(null);

  const allAgreed = useMemo(() => AGREEMENTS.every((item) => checked[item.key]), [checked]);
  const viewingItem = useMemo(
    () => AGREEMENTS.find((item) => item.key === viewingKey) ?? null,
    [viewingKey]
  );

  const handleBack = useCallback(() => {
    resetStore();
    router.back();
  }, [resetStore]);

  const toggleAll = useCallback(() => {
    const next = !allAgreed;
    setChecked({ terms: next, privacy: next });
  }, [allAgreed]);

  const toggleItem = useCallback((key: AgreementKey) => {
    setChecked((prev) => ({ ...prev, [key]: !prev[key] }));
  }, []);

  const openSheet = useCallback((key: AgreementKey) => setViewingKey(key), []);
  const closeSheet = useCallback(() => setViewingKey(null), []);

  return (
    <SignupForm
      title="약관 동의"
      description="안전한 서비스 이용을 위해 약관에 동의해주세요"
      onNext={nextStep}
      onBack={handleBack}
      nextButtonText="동의하고 계속"
      isNextDisabled={!allAgreed}>
      <View className="gap-6">
        <View
          className={`rounded-3xl border px-5 py-5 ${
            allAgreed ? 'border-main-500 bg-main-100' : 'border-gray-100 bg-gray-50'
          }`}>
          <Checkbox
            checked={allAgreed}
            onPress={toggleAll}
            size="lg"
            label={
              <View>
                <Text className="text-body3 font-semibold text-gray-900">약관 전체 동의</Text>
                <Text className="mt-1 text-caption text-gray-500">
                  이용약관, 개인정보처리방침에 모두 동의합니다
                </Text>
              </View>
            }
          />
        </View>

        <View className="gap-3">
          {AGREEMENTS.map((item) => {
            const isChecked = checked[item.key];

            return (
              <View
                key={item.key}
                className={`flex-row items-center gap-3 rounded-2xl border bg-white px-4 py-4 ${
                  isChecked ? 'border-main-300' : 'border-gray-100'
                }`}>
                <View className="flex-1">
                  <Checkbox
                    checked={isChecked}
                    onPress={() => toggleItem(item.key)}
                    label={
                      <Text className="text-body4 text-gray-900">
                        {item.title} <Text className="text-main-600">(필수)</Text>
                      </Text>
                    }
                  />
                </View>
                <TouchableOpacity
                  testID={`view-${item.key}`}
                  className="p-1"
                  onPress={() => openSheet(item.key)}
                  hitSlop={8}>
                  <Icon name="chevron-forward" size={20} color="#A5A6A9" />
                </TouchableOpacity>
              </View>
            );
          })}
        </View>
      </View>

      <Modal
        visible={viewingItem !== null}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={closeSheet}>
        {viewingItem && (
          <SafeAreaView className="flex-1 bg-white">
            <View className="flex-row items-center justify-between border-b border-gray-100 px-5 py-4">
              <Text className="text-body1 text-gray-900">{viewingItem.title}</Text>
              <TouchableOpacity testID="sheet-close-button" onPress={closeSheet} hitSlop={8}>
                <Text className="text-body4 text-main-600">닫기</Text>
              </TouchableOpacity>
            </View>
            <ScrollView
              className="flex-1"
              contentContainerStyle={{ padding: 20 }}
              showsVerticalScrollIndicator={false}>
              <Text testID="sheet-content" className="text-body5 leading-6 text-gray-700">
                {viewingItem.content}
              </Text>
            </ScrollView>
          </SafeAreaView>
        )}
      </Modal>
    </SignupForm>
  );
}

export default memo(TermsStep);

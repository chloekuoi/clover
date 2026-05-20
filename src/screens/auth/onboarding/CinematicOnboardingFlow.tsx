import React, { useCallback, useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useAuth } from '../../../context/AuthContext';
import { loadClickSound, unloadClickSound } from './audioService';
import { GrainOverlay } from './components/GrainOverlay';
import { onboardingTheme as t } from './theme';
import { HookScreen } from './screens/HookScreen';
import { IdentityScreen } from './screens/IdentityScreen';
import { BirthdayScreen } from './screens/BirthdayScreen';
import { AboutScreen } from './screens/AboutScreen';
import { BuildingScreen } from './screens/BuildingScreen';
import { PhotoScreen } from './screens/PhotoScreen';
import { NotificationsScreen } from './screens/NotificationsScreen';
import { ContactSyncScreen } from './screens/ContactSyncScreen';
import { SuccessScreen } from './screens/SuccessScreen';
import { LookingForScreen } from './screens/LookingForScreen';

export interface OnboardingState {
  name: string;
  photoUris: (string | null)[];   // index = position (0–4)
  birthday: string;           // ISO: YYYY-MM-DD
  workType: string[];
  desiredRoles: string[];
  currentlyWorkingOn: string;
  notificationsGranted: boolean;
  contactsGranted: boolean;
}

export interface ScreenProps {
  state: OnboardingState;
  setState: React.Dispatch<React.SetStateAction<OnboardingState>>;
  onNext: () => void;
  onBack: () => void;
  currentStep: number;
  totalSteps: number;
  onComplete: () => void;
}

interface CinematicOnboardingFlowProps {
  onComplete: () => void;
}

const TOTAL_STEPS = 10;

const INITIAL_STATE: OnboardingState = {
  name: '',
  photoUris: [null, null, null, null, null],
  birthday: '',
  workType: [],
  desiredRoles: ['Open to anyone'],
  currentlyWorkingOn: '',
  notificationsGranted: false,
  contactsGranted: false,
};

export function CinematicOnboardingFlow({ onComplete }: CinematicOnboardingFlowProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [state, setState] = useState<OnboardingState>(INITIAL_STATE);
  const { signOut } = useAuth();

  useEffect(() => {
    loadClickSound();
    return () => {
      unloadClickSound();
    };
  }, []);

  const handleNext = useCallback(() => {
    if (currentStep < TOTAL_STEPS - 1) {
      setCurrentStep(s => s + 1);
    }
  }, [currentStep]);

  const handleBack = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep(s => s - 1);
      return;
    }
    void signOut();
  }, [currentStep, signOut]);

  const screenProps: ScreenProps = {
    state,
    setState,
    onNext: handleNext,
    onBack: handleBack,
    currentStep,
    totalSteps: TOTAL_STEPS,
    onComplete,
  };

  const renderScreen = () => {
    const props: ScreenProps = screenProps;
    switch (currentStep) {
      case 0: return <HookScreen {...props} />;
      case 1: return <IdentityScreen {...props} />;
      case 2: return <PhotoScreen {...props} />;
      case 3: return <BirthdayScreen {...props} />;
      case 4: return <BuildingScreen {...props} />;
      case 5: return <AboutScreen {...props} />;
      case 6: return <LookingForScreen {...props} />;
      case 7: return <NotificationsScreen {...props} />;
      case 8: return <ContactSyncScreen {...props} />;
      case 9: return <SuccessScreen {...props} />;
      default: return null;
    }
  };

  return (
    <View style={styles.root}>
      <GrainOverlay />
      {renderScreen()}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: t.bg,
  },
});

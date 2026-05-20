import React, { useCallback, useEffect, useState } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import { theme } from '../../constants';
import { DiscoveryCard } from '../../types';
import SwipeCard, { CARD_WIDTH, CARD_HEIGHT } from './SwipeCard';
import SwipeButtons from './SwipeButtons';
import UserProfileModal from './UserProfileModal';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.3;
const SWIPE_VELOCITY_THRESHOLD = 800;

type CardStackProps = {
  cards: DiscoveryCard[];
  onSwipe: (card: DiscoveryCard, direction: 'left' | 'right') => void;
  onEmpty: () => void;
};

export default function CardStack({ cards, onSwipe, onEmpty }: CardStackProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedCard, setSelectedCard] = useState<DiscoveryCard | null>(null);

  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);

  const currentCard = cards[currentIndex];
  const nextCard = cards[currentIndex + 1];
  const thirdCard = cards[currentIndex + 2];

  const handleSwipeComplete = useCallback(
    (direction: 'left' | 'right') => {
      if (currentCard) {
        onSwipe(currentCard, direction);
      }

      const nextIndex = currentIndex + 1;
      if (nextIndex >= cards.length) {
        onEmpty();
      }
      setCurrentIndex(nextIndex);

      // Reset position for next card
      translateX.value = 0;
      translateY.value = 0;
    },
    [currentCard, currentIndex, cards.length, onSwipe, onEmpty, translateX, translateY]
  );

  useEffect(() => {
    if (currentIndex >= cards.length) {
      setCurrentIndex(0);
      translateX.value = 0;
      translateY.value = 0;
    }
  }, [cards.length, currentIndex, translateX, translateY]);

  const panGesture = Gesture.Pan()
    .onUpdate((event) => {
      translateX.value = event.translationX;
      translateY.value = event.translationY;
    })
    .onEnd((event) => {
      const shouldSwipeRight =
        translateX.value > SWIPE_THRESHOLD ||
        event.velocityX > SWIPE_VELOCITY_THRESHOLD;
      const shouldSwipeLeft =
        translateX.value < -SWIPE_THRESHOLD ||
        event.velocityX < -SWIPE_VELOCITY_THRESHOLD;

      if (shouldSwipeRight) {
        translateX.value = withTiming(SCREEN_WIDTH * 1.5, { duration: 300 }, () => {
          runOnJS(handleSwipeComplete)('right');
        });
      } else if (shouldSwipeLeft) {
        translateX.value = withTiming(-SCREEN_WIDTH * 1.5, { duration: 300 }, () => {
          runOnJS(handleSwipeComplete)('left');
        });
      } else {
        // Snap back
        translateX.value = withSpring(0, { damping: 15 });
        translateY.value = withSpring(0, { damping: 15 });
      }
    });

  // Tap opens the profile modal — Exclusive means pan wins if user moves finger
  const tapGesture = Gesture.Tap()
    .maxDuration(250)
    .onEnd(() => {
      if (currentCard) {
        runOnJS(setSelectedCard)(currentCard);
      }
    });

  const composedGesture = Gesture.Exclusive(tapGesture, panGesture);

  const cardAnimatedStyle = useAnimatedStyle(() => {
    const rotate = interpolate(
      translateX.value,
      [-SCREEN_WIDTH / 2, 0, SCREEN_WIDTH / 2],
      [-15, 0, 15],
      Extrapolation.CLAMP
    );

    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { rotate: `${rotate}deg` },
      ] as const,
    };
  });

  const nextCardScale = useAnimatedStyle(() => {
    const scale = interpolate(
      Math.abs(translateX.value),
      [0, SWIPE_THRESHOLD],
      [0.95, 1],
      Extrapolation.CLAMP
    );
    const translateYValue = interpolate(
      Math.abs(translateX.value),
      [0, SWIPE_THRESHOLD],
      [10, 0],
      Extrapolation.CLAMP
    );

    return {
      transform: [{ scale }, { translateY: translateYValue }] as const,
    };
  });

  const thirdCardScale = useAnimatedStyle(() => {
    const scale = interpolate(
      Math.abs(translateX.value),
      [0, SWIPE_THRESHOLD],
      [0.9, 0.95],
      Extrapolation.CLAMP
    );
    const translateYValue = interpolate(
      Math.abs(translateX.value),
      [0, SWIPE_THRESHOLD],
      [20, 10],
      Extrapolation.CLAMP
    );

    return {
      transform: [{ scale }, { translateY: translateYValue }] as const,
    };
  });

  const handleButtonSwipe = (direction: 'left' | 'right') => {
    const targetX = direction === 'right' ? SCREEN_WIDTH * 1.5 : -SCREEN_WIDTH * 1.5;
    translateX.value = withTiming(targetX, { duration: 300 }, () => {
      runOnJS(handleSwipeComplete)(direction);
    });
  };

  if (!currentCard) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.cardContainer}>
        {/* Third card (bottom) */}
        {thirdCard && (
          <Animated.View style={[styles.cardWrapper, styles.thirdCard, thirdCardScale]}>
            <SwipeCard card={thirdCard} />
          </Animated.View>
        )}

        {/* Next card (underneath) */}
        {nextCard && (
          <Animated.View style={[styles.cardWrapper, styles.nextCard, nextCardScale]}>
            <SwipeCard card={nextCard} />
          </Animated.View>
        )}

        {/* Current card (on top) */}
        <GestureDetector gesture={composedGesture}>
          <Animated.View style={[styles.cardWrapper, cardAnimatedStyle]}>
            <SwipeCard card={currentCard} translateX={translateX} isTopCard />
          </Animated.View>
        </GestureDetector>
      </View>

      {/* Swipe buttons */}
      <SwipeButtons
        onSwipeLeft={() => handleButtonSwipe('left')}
        onSwipeRight={() => handleButtonSwipe('right')}
      />

      {/* Profile modal — Skip/Connect trigger same animation as physical swipe */}
      <UserProfileModal
        visible={selectedCard !== null}
        card={selectedCard}
        onDismiss={() => setSelectedCard(null)}
        onSkip={() => {
          setSelectedCard(null);
          handleButtonSwipe('left');
        }}
        onConnect={() => {
          setSelectedCard(null);
          handleButtonSwipe('right');
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardContainer: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardWrapper: {
    position: 'absolute',
  },
  nextCard: {
    zIndex: -1,
  },
  thirdCard: {
    zIndex: -2,
  },
});

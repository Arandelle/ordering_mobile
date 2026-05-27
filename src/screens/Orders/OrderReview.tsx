import { useMemo, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Star } from 'lucide-react-native';
import { useOrder, useSubmitReview } from '@/hooks/useOrders';
import { ItemReviewInput } from '@/types/review.type';

const BRAND = '#e13e00';

type ItemReviewState = Record<string, { rating: number | null; comment: string }>;

function getErrorMessage(error: unknown) {
  if (typeof error === 'object' && error !== null && 'message' in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === 'string') return message;
  }

  return 'Unable to submit review. Please try again.';
}

function RatingStars({
  value,
  onChange,
  size = 30,
}: {
  value: number;
  onChange: (rating: number) => void;
  size?: number;
}) {
  return (
    <View className="flex-row gap-1">
      {[1, 2, 3, 4, 5].map((rating) => {
        const isSelected = rating <= value;

        return (
          <TouchableOpacity
            key={rating}
            className="h-10 w-10 items-center justify-center"
            activeOpacity={0.8}
            onPress={() => onChange(rating)}>
            <Star
              size={size}
              color={isSelected ? BRAND : '#d1d5db'}
              fill={isSelected ? BRAND : 'transparent'}
            />
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

export default function OrderReview() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const orderId = Array.isArray(id) ? id[0] : id;
  const { data: order, isLoading } = useOrder(orderId);
  const submitReview = useSubmitReview(orderId);

  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [itemRatings, setItemRatings] = useState<ItemReviewState>({});

  const referenceNumber = order?.paymentInfo.referenceNumber ?? order?._id ?? '';

  const itemReviews = useMemo<ItemReviewInput[]>(() => {
    if (!order) return [];

    return order.items
      .map((item) => {
        const itemReview = itemRatings[item.productId];

        return {
          productId: item.productId,
          name: item.name,
          image: item.image ?? null,
          rating: itemReview?.rating ?? null,
          comment: itemReview?.comment?.trim() || null,
        };
      })
      .filter((itemReview) => itemReview.rating !== null || itemReview.comment);
  }, [itemRatings, order]);

  const handleItemRatingChange = (productId: string, nextRating: number) => {
    setItemRatings((current) => ({
      ...current,
      [productId]: {
        rating: nextRating,
        comment: current[productId]?.comment ?? '',
      },
    }));
  };

  const handleItemCommentChange = (productId: string, nextComment: string) => {
    setItemRatings((current) => ({
      ...current,
      [productId]: {
        rating: current[productId]?.rating ?? null,
        comment: nextComment,
      },
    }));
  };

  const handleSubmit = async () => {
    if (!orderId || !order) return;

    if (rating < 1) {
      Alert.alert('Rating required', 'Please rate your overall experience.');
      return;
    }

    try {
      await submitReview.mutateAsync({
        rating,
        comment: comment.trim() || undefined,
        itemReviews,
      });

      Alert.alert('Review submitted', 'Thank you for sharing your feedback.', [
        {
          text: 'Done',
          onPress: () => router.replace(`/orders/${orderId}`),
        },
      ]);
    } catch (error) {
      Alert.alert('Review failed', getErrorMessage(error));
    }
  };

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50">
        <ActivityIndicator color={BRAND} />
      </View>
    );
  }

  if (!order) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50 px-6">
        <Text className="text-center text-lg font-extrabold text-gray-950">Order not found</Text>
        <Text className="mt-2 text-center text-sm text-gray-500">
          Unable to load this order for review.
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      className="flex-1 bg-gray-50"
      contentContainerClassName="px-5 pb-8 pt-6"
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}>
      <View className="mb-5">
        <Text className="text-2xl font-extrabold text-gray-950">Rate your experience</Text>
        <Text className="mt-1 text-sm text-gray-500">{referenceNumber}</Text>
      </View>

      <View className="mb-4 rounded-2xl bg-white p-4 shadow-sm">
        <Text className="text-[15px] font-bold text-gray-950">Overall experience</Text>
        <View className="mt-3">
          <RatingStars value={rating} onChange={setRating} />
        </View>

        <Text className="mb-1.5 mt-5 text-[13px] font-semibold text-gray-700">
          Overall comment
        </Text>
        <TextInput
          className="min-h-24 rounded-2xl border border-gray-200 bg-gray-50 px-3.5 py-3 text-sm text-gray-950"
          placeholder="Tell us about your order..."
          placeholderTextColor="#b9b9b9"
          value={comment}
          onChangeText={setComment}
          multiline
          textAlignVertical="top"
        />
      </View>

      <View className="mb-4 rounded-2xl bg-white p-4 shadow-sm">
        <Text className="text-[15px] font-bold text-gray-950">Rate individual items</Text>

        <View className="mt-4 gap-4">
          {order.items.map((item, index) => {
            const itemReview = itemRatings[item.productId];
            const itemRating = itemReview?.rating ?? 0;
            const isLastItem = index === order.items.length - 1;

            return (
              <View
                key={item.productId}
                className={`${isLastItem ? '' : 'border-b border-gray-100'} pb-4`}>
                <View className="flex-row gap-3">
                  <View className="h-16 w-16 overflow-hidden rounded-2xl bg-gray-100">
                    {item.image ? (
                      <Image source={{ uri: item.image }} className="h-full w-full" resizeMode="cover" />
                    ) : (
                      <View className="h-full w-full items-center justify-center">
                        <Text className="text-xs font-bold text-gray-400">No image</Text>
                      </View>
                    )}
                  </View>

                  <View className="flex-1">
                    <Text className="text-sm font-extrabold text-gray-950" numberOfLines={2}>
                      {item.name}
                    </Text>
                    <Text className="mt-1 text-xs text-gray-500">Qty {item.quantity}</Text>
                    <View className="mt-2">
                      <RatingStars
                        value={itemRating}
                        onChange={(nextRating) => handleItemRatingChange(item.productId, nextRating)}
                        size={24}
                      />
                    </View>
                  </View>
                </View>

                {itemRating > 0 && (
                  <TextInput
                    className="mt-3 min-h-20 rounded-2xl border border-gray-200 bg-gray-50 px-3.5 py-3 text-sm text-gray-950"
                    placeholder="Comment for this item..."
                    placeholderTextColor="#b9b9b9"
                    value={itemReview?.comment ?? ''}
                    onChangeText={(nextComment) =>
                      handleItemCommentChange(item.productId, nextComment)
                    }
                    multiline
                    textAlignVertical="top"
                  />
                )}
              </View>
            );
          })}
        </View>
      </View>

      <TouchableOpacity
        className={`min-h-12 items-center justify-center rounded-2xl bg-[#e13e00] ${
          submitReview.isPending || rating < 1 ? 'opacity-[0.65]' : ''
        }`}
        activeOpacity={0.85}
        disabled={submitReview.isPending || rating < 1}
        onPress={handleSubmit}>
        <Text className="text-[15px] font-bold text-white">
          {submitReview.isPending ? 'Submitting...' : 'Submit Review'}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

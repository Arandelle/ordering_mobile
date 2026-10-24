import { Text, View } from 'react-native';

const STEPS = ['Details', 'Address', 'Review'];

interface CheckoutStepperProps {
  currentStep: number;
}

const CheckoutStepper = ({ currentStep }: CheckoutStepperProps) => {
  return (
    <View className="mb-6 rounded-2xl bg-orange-50 px-4 py-3 w-full">
      <View className="flex-row items-center justify-between">
        {STEPS.map((step, index) => {
          const stepNumber = index + 1;
          const isActive = stepNumber <= currentStep;
          const isLast = index === STEPS.length - 1;

          return (
            <View
              key={step}
              className={`flex-row items-center ${!isLast ? 'flex-1' : ''}`}>
              <View className="items-center">
                <View
                  className={`h-8 w-8 items-center justify-center rounded-full ${
                    isActive ? 'bg-[#e13e00]' : 'bg-white'
                  }`}>
                  <Text
                    className={`text-xs font-bold ${
                      isActive ? 'text-white' : 'text-gray-400'
                    }`}>
                    {stepNumber}
                  </Text>
                </View>
                <Text
                  className={`mt-1 text-[11px] ${
                    isActive ? 'font-bold text-[#e13e00]' : 'text-gray-400'
                  }`}>
                  {step}
                </Text>
              </View>

              {!isLast && (
                <View className="flex-1 items-center">
                  <View
                    className={`mb-4 h-[2px] w-full ${
                      isActive ? 'bg-[#e13e00]' : 'bg-white'
                    }`}
                  />
                </View>
              )}
            </View>
          );
        })}
      </View>
    </View>
  );
};

export default CheckoutStepper;
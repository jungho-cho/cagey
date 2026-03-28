import { appsInToss } from '@apps-in-toss/framework/plugins';
import { defineConfig } from '@granite-js/react-native/config';

export default defineConfig({
  appName: 'cagey', // 앱인토스 콘솔에서 생성한 앱 이름으로 교체
  plugins: [
    appsInToss({
      brand: {
        displayName: 'Cagey',
        primaryColor: '#2563EB',
        icon: '', // 콘솔에서 업로드 후 URL 교체
      },
      permissions: [],
    }),
  ],
});

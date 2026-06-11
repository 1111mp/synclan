import { createMemoryRouter } from 'react-router';

import HomePage from '@/pages/home';
import WelcomePage from '@/pages/welcome';

export const router = createMemoryRouter(
  [
    {
      path: '/',
      Component: HomePage,
      children: [
        {
          path: 'welcome',
          Component: WelcomePage,
        },
        {
          path: 'device/:id',
          lazy: () => import('@/pages/device'),
        },
      ],
    },
  ],
  {
    initialEntries: ['/welcome'],
  },
);

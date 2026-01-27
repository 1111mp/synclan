import { createMemoryRouter } from 'react-router';
import HomePage from '@/pages/home';
import ConversationPage from '@/pages/conversation';

export const router = createMemoryRouter(
  [
    {
      Component: HomePage,
      children: [
        {
          path: '/conversation',
          element: <ConversationPage />,
          children: [
            {
              path: ':id',
              lazy: () => import('@/pages/room'),
            },
          ],
        },
      ],
    },
  ],
  {
    initialEntries: ['/conversation'],
  },
);

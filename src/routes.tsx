import {
  createBrowserRouter,
  createMemoryRouter,
  Navigate,
} from 'react-router';

import { isWeb } from '@/lib/constant';
import HomePage from '@/pages/home';
import WelcomePage from '@/pages/welcome';

export const router = isWeb
  ? createBrowserRouter([
      {
        path: '/',
        Component: HomePage,
        children: [
          {
            index: true,
            element: <Navigate to='/welcome' replace />,
          },
          {
            path: 'welcome',
            Component: WelcomePage,
          },
          {
            path: 'devices/:id',
            lazy: () => import('@/pages/devices'),
          },
          {
            path: 'profile',
            lazy: () => import('@/pages/profile'),
          },
          {
            path: 'settings',
            lazy: () => import('@/pages/settings'),
          },
        ],
      },
    ])
  : createMemoryRouter(
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
              path: 'devices/:id',
              lazy: () => import('@/pages/devices'),
            },
            {
              path: 'profile',
              lazy: () => import('@/pages/profile'),
            },
            {
              path: 'settings',
              lazy: () => import('@/pages/settings'),
            },
            {
              path: 'manager',
              lazy: () => import('@/pages/manager'),
            },
          ],
        },
      ],
      {
        initialEntries: ['/welcome'],
      },
    );

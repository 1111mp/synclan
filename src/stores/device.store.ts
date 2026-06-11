import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

type DeviceState = {
  loading: boolean;
  current: IDevice | null;
  devices: IDevice[];
  updateLoading: (loading: boolean) => void;
  updateCurrent: (device: IDevice) => void;
  updateDevices: (devices: IDevice[]) => void;
};

export const useDeviceStore = create<DeviceState>()(
  immer((set) => ({
    loading: true,
    current: null,
    devices: [],

    updateLoading: (loading: boolean) =>
      set((state) => {
        state.loading = loading;
      }),
    updateCurrent: (device: IDevice) => {
      set((state) => {
        state.current = device;
      });
    },
    updateDevices: (devices: IDevice[]) => {
      set((state) => {
        state.devices = devices;
      });
    },
  })),
);

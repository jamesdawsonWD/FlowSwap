import { IModal, ModalTypes, Project } from '@/types';
import { defineStore } from 'pinia';

export const useUi = defineStore('ui', {
    state: () => ({
        modalState: {
            show: false,
            type: ModalTypes.ProjectInfo,
        },
        transition: {
            show: false,
        },
        darkMode: false,
        isConnected: false,
    }),
    getters: {
        getIsModalAwake: (state) => state.modalState.show,
        getModal: (state) => state.modalState,
        getTransition: (state) => state.transition.show,
        getDarkMode: (state) => state.darkMode,
        getIsConnected: (state) => state.isConnected,
    },
    actions: {
        darkModeOn() {
            this.darkMode = true;
        },
        darkModeOff() {
            this.darkMode = false;
        },
        setConnected(connected: boolean) {
            this.isConnected = connected;
        },
        closeModal(): void {
            const modal = {
                show: false,
                type: ModalTypes.ProjectInfo,
            };
            this.modalState = modal;
        },
        startTransition(): void {
            const transition = {
                show: true,
            };
            this.transition = transition;
        },
        stopTransition(): void {
            const transition = {
                show: false,
            };
            this.transition = transition;
        },
        openModal(type: ModalTypes, data?: Project): void {
            const modal: IModal = {
                show: true,
                type,
                data,
            };
            this.modalState = modal;
        },
    },
});

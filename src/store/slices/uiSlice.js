export const createUiSlice = (set) => ({
    activeModal: null, // 'transaction', 'transfer', 'account'
    modalProps: {},

    openModal: (modalName, props = {}) => set({ activeModal: modalName, modalProps: props }),
    closeModal: () => set({ activeModal: null, modalProps: {} }),
});

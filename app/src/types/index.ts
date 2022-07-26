export type Address = string;
export type GenericCallback = (a?: any, b?: any, c?: any) => void;
export interface ISocialMedia {
    name: string;
    url: string;
}

export interface IModal {
    show: boolean;
    type: ModalTypes;
    data?: AssetInfo;
    callback?: GenericCallback;
}
export enum ModalTypes {
    AssetList,
}
declare global {
    interface Window {
        ethereum: any;
        web3: any;
    }
}


export interface AssetInfo {
    name: string;
    symbol: string;
    logo: string;
}

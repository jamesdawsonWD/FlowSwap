export type Address = string;

export interface ISocialMedia {
    name: string;
    url: string;
}
export interface NFTs {
    balance: {
        [key: string]: NFT[];
    };
    tokens: {
        [key: string]: NFT[];
    };
}

export interface Project {
    title: string;
    url?: string;
    description: string;
    modal: ModalTypes;
    twitter?: string;
    github?: string;
    image: string;
}
export interface NFT {
    [key: string]: any;
    result: any[];
}

export interface IModal {
    show: boolean;
    type: ModalTypes;
    data?: Project;
}
export enum ModalTypes {
    ProjectInfo,
}
declare global {
    interface Window {
        ethereum: any;
        web3: any;
    }
}

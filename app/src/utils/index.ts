export const addressZero = '0x' + '0'.repeat(40);
export const SECONFS_IN_DAY = 86400;

export const capitilise = (value: string) => {
    if (!value) {
        return '';
    }
    return value.charAt(0).toUpperCase() + value.slice(1);
};

export const shortAddress = (value: string) => {
    if (!value) {
        return '';
    }
    return value.substring(0, 6) + '...' + value.substring(value.length - 4, value.length + 1);
};

export const getEvent = (receipt: any, event: string) =>
    receipt.events?.filter((x: any) => x.event == event);

export const addressZero = '0x' + '0'.repeat(40);
export async function retrieveEventParam(
    tx: any,
    eventName: string,
    param: string
) {
    const receipt = await tx.wait();
    const event = getEvent(receipt, eventName);
    return event[0].args[param];
}

export const sortAddresses = (address0: string, address1: string) =>
    address0 < address1 ? [address0, address1] : [address1, address0];

export const getEvent = (receipt: any, event: string) =>
    receipt.events?.filter((x: any) => x.event == event);

export async function retrieveEventParam(
    tx: any,
    eventName: string,
    param: string
) {
    const receipt = await tx.wait();
    const event = getEvent(receipt, eventName);
    return event[0].args[param];
}

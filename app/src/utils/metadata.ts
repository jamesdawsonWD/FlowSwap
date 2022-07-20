import { resolveLink } from './ipfs';

/**
 * Fet Metadata  from NFT and Cache Results
 * @param {object} NFT
 * @returns NFT
 */
export function verifyMetadata(NFT: any) {
    //Pass Through if Metadata already present
    if (NFT.metadata) {
        NFT.metadata = checkMetadataIsString(NFT.metadata) ? JSON.parse(NFT.metadata) : NFT.metadata;
        NFT.image = NFT.metadata?.image ? resolveLink(NFT.metadata.image) : NFT.image;
        return NFT;
    }
    //Get the Metadata
    getMetadata(NFT);
    //Return Hooked NFT Object
    return NFT;
} //verifyMetadata()

/**
 * Extract Metadata from NFT,
 *  Fallback: Fetch from URI
 * @param {object} NFT
 * @returns void
 */
async function getMetadata(NFT: any) {
    //Validate URI
    if (!NFT.token_uri || !NFT.token_uri.includes('://')) {
        console.log('getMetadata() Invalid URI', {
            URI: NFT.token_uri,
            NFT,
        });
        return;
    }
    //Get Metadata
    fetch(NFT.token_uri)
        .then((res) => res.json())
        .then((metadata) => {
            if (!metadata) {
                //Log
                console.error('useVerifyMetadata.getMetadata() No Metadata found on URI:', {
                    URI: NFT.token_uri,
                    NFT,
                });
            }
            //Handle Setbacks
            else if (metadata?.detail && metadata.detail.includes('Request was throttled')) {
                //Log
                console.warn(
                    'useVerifyMetadata.getMetadata() Bad Result for:' + NFT.token_uri + '  Will retry later',
                    { NFT, metadata }
                );
                //Retry That Again after 1s
                setTimeout(function () {
                    getMetadata(NFT);
                }, 1000);
            } //Handle Opensea's {detail: "Request was throttled. Expected available in 1 second."}
            else {
                //No Errors
                //Set
                setMetadata(NFT, metadata);
                //Log
                console.log('getMetadata() Late-load for NFT Metadata ' + NFT.token_uri, { metadata });
            } //Valid Result
        })
        .catch((err) => {
            console.error('useVerifyMetadata.getMetadata() Error Caught:', {
                err,
                NFT,
                URI: NFT.token_uri,
            });
        });
} //getMetadata()

/**
 * Update NFT Object
 * @param {object} NFT
 * @param {object} metadata
 */
function setMetadata(NFT: any, metadata: any) {
    //Add Metadata
    NFT.metadata = metadata;
    //Set Image
    if (metadata?.image) NFT.image = resolveLink(metadata.image);
} //setMetadata()

function checkMetadataIsString(metadata: any) {
    return typeof metadata === 'string' || metadata instanceof String;
}

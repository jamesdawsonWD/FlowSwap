import { expect } from 'chai';
import { ethers, waffle } from 'hardhat';
import { getEvent } from './helpers';
import { BigNumber } from 'ethers';
import { SuperTokenMock, SuperfluidMock } from '../typechain-types';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
const { Framework } from "@superfluid-finance/sdk-core";
const provider = waffle.provider;

describe('Token contract', () => {
    let gallery;
    let flowFactory;
    let gallery1;
    let gallery2;
    let superfluid: SuperfluidMock;
    let superTokenMock1: SuperTokenMock;
    let superTokenMock2: SuperTokenMock;
    let addrs: SignerWithAddress[];
    let owner: SignerWithAddress;
    let addr1: SignerWithAddress;
    let addr2: SignerWithAddress;

    beforeEach(async () => {
        [owner, addr1, addr2, ...addrs] = await ethers.getSigners();

        const SuperTokenMock1 = await ethers.getContractFactory(
            'SuperTokenMock'
        );
        const SuperfluidMock = await ethers.getContractFactory(
            'SuperfluidMock'
        );
        superfluid = await SuperfluidMock.deploy(false, false);
        superTokenMock1 = await SuperTokenMock1.deploy('Test NFT', 'TNFT');
        await testNft.deployed();

        await testNft.connect(addr1).mint();
        await testNft.connect(addr2).mint();

        Gallery = await ethers.getContractFactory('Gallery');
        gallery = await Gallery.deploy();
        await gallery.deployed();

        GalleryFactory = await ethers.getContractFactory('GalleryFactory');
        galleryFactory = await GalleryFactory.deploy(gallery.address);
        await galleryFactory.deployed();

        const tx1 = await galleryFactory.createGallery(
            'Gallery1',
            'Test description 1',
            ethers.utils.parseEther('25')
        );
        gallery1 = Gallery.attach(getGalleryAddress(tx1));

        const tx2 = await galleryFactory.createGallery(
            'Gallery2',
            'Test description 2',
            ethers.utils.parseEther('25')
        );
        gallery2 = Gallery.attach(getGalleryAddress(tx2));
    });

    describe('Deployment', () => {
        it('GalleryFactory: Should set correct library address', async () => {
            expect(await galleryFactory.libraryAddress()).to.equal(
                gallery.address
            );
        });
        it('Gallery1(Proxy): Should be deployed and contain gallery name', async () => {
            expect(await gallery1.name()).to.equal('Gallery1');
        });
        it('Gallery2(Proxy): Should be deployed and contain gallery name', async () => {
            expect(await gallery2.name()).to.equal('Gallery2');
        });
        it('TestNFT: Should be deployed and give deployer balance of 5', async () => {
            expect(await testNft.balanceOf(owner.address)).to.equal(5);
        });
    });

    describe('Gallery', () => {
        it('Should Donate an NFT', async () => {
            const totalDonationsBefore = await gallery1.totalNftDonations();
            await testNft.connect(addr1).approve(gallery1.address, 6);
            const tx = await gallery1
                .connect(addr1)
                .donate(testNft.address, 6, ethers.utils.parseEther('25'));
            const receipt = await tx.wait();
            const event = getEvent(receipt, 'Donated');
            const donationId = event[0].args['donationID'];
            const donation = await gallery1.donations(donationId);
            const totalDonationsAfter = await gallery1.totalNftDonations();

            expect(totalDonationsBefore.toNumber() + 1).to.equal(
                totalDonationsAfter
            );
            expect(await testNft.ownerOf(6)).to.equal(await gallery1.address);
            expect(donation['price']).to.equal(ethers.utils.parseEther('25'));
            expect(donation['donator']).to.equal(addr1.address);
            expect(donation['tokenId']).to.equal(6);
            expect(donation['collection']).to.equal(testNft.address);
            expect(donation['sold']).to.equal(false);
        });
        it('Should buy a donated NFT', async () => {
            const totalDonationsBefore = await gallery1.totalDonations();
            await testNft.connect(addr1).approve(gallery1.address, 6);
            const tx = await gallery1
                .connect(addr1)
                .donate(testNft.address, 6, ethers.utils.parseEther('25'));
            await gallery1
                .connect(addr2)
                .buy(1, { value: ethers.utils.parseEther('25') });
            const totalDonationsAfter = await gallery1.totalDonations();
            expect(await testNft.ownerOf(6)).to.equal(addr2.address);
            expect(ethers.utils.parseEther('25')).to.equal(totalDonationsAfter);
        });
        it('Should allow guardian to withdraw', async () => {
            await testNft.connect(addr1).approve(gallery1.address, 6);
            await gallery1
                .connect(addr1)
                .donate(testNft.address, 6, ethers.utils.parseEther('25'));
            await gallery1.connect(
                addr2.buy(1, { value: ethers.utils.parseEther('25') })
            );

            const balanceBefore = await provider.getBalance(owner.address);
            const tx = await gallery1.withdraw();
            const receipt = await tx.wait();
            const balanceAfter = await provider.getBalance(owner.address);
        });
    });
});

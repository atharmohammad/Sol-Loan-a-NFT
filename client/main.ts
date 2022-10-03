import {
    LAMPORTS_PER_SOL,
    sendAndConfirmTransaction,
    PublicKey,
    Connection,
    Keypair,
    Transaction,
    TransactionInstruction,
    SYSVAR_RENT_PUBKEY,
    SystemProgram,
    Struct,
    SYSVAR_CLOCK_PUBKEY
} from "@solana/web3.js";
import {TOKEN_PROGRAM_ID,ASSOCIATED_TOKEN_PROGRAM_ID, getAssociatedTokenAddress, createAssociatedTokenAccount, AccountLayout, transfer, mintTo, createAssociatedTokenAccountInstruction, createMint, createInitializeAccountInstruction, createInitializeAccount3Instruction, createMintToInstruction, getOrCreateAssociatedTokenAccount, initializeAccountInstructionData} from "@solana/spl-token";
import fs from 'mz/fs';
import os from 'os';
import path from 'path';
import yaml from 'yaml';
import {struct,u32,u8} from "@solana/buffer-layout";
import {bigInt, publicKey, u64} from "@solana/buffer-layout-utils"
import { serialize, deserialize, deserializeUnchecked } from "borsh";
import assert from "assert";

class Payload extends Struct {
    constructor(properties : any) {
      super(properties);
    }
  }
  
// Path to local Solana CLI config file.
const CONFIG_FILE_PATH = path.resolve(
    os.homedir(),
    '.config',
    'solana',
    'cli',
    'config.yml',
);
const PROGRAM_KEYPAIR_PATH = path.join(
    path.resolve(__dirname,"../dist/program/"),"nftloans-keypair.json"
);

const createAccount = async(connection:Connection) : Promise<Keypair> => {
    const key = Keypair.generate();
    const airdrop = await connection.requestAirdrop(key.publicKey,2*LAMPORTS_PER_SOL);
    await connection.confirmTransaction(airdrop)
    return key;
}

const createKeypairFromFile = async(path:string): Promise<Keypair> => {
    const secret_keypair = await fs.readFile(path,{encoding:"utf8"});
    const secret_key = Uint8Array.from(JSON.parse(secret_keypair));
    const programKeypair = Keypair.fromSecretKey(secret_key);
    return programKeypair;
}
/*pub struct Request {
    pub is_initialized: u8,             // 1
    pub borrower: Pubkey,               // 32
    pub borrower_token_account: Pubkey, // 32
    pub collateral_nft: Pubkey,         // 32
    pub vault: Pubkey,                  // 32
    pub lender : Pubkey,                // 32
    pub loan_amount: u64,               // 8
    pub deadline: u64,                  // 8
}
*/

interface request {
    isInitialized : number;
    borrower : PublicKey;
    borrowerTokenAccount : PublicKey;
    principalToken : PublicKey;
    collateralNft : PublicKey;
    vault : PublicKey;
    lender : PublicKey,
    loanAmount : bigint;
    deadline : bigint;
    loanSubmissionTime: bigint;
} 

const REQUEST_LAYOUT = struct<request>([
    u8("isInitialized"),
    publicKey("borrower"),
    publicKey("borrowerTokenAccount"),
    publicKey("principalToken"),
    publicKey("collateralNft"),
    publicKey("vault"),
    publicKey("lender"),
    u64("loanAmount"),
    u64("deadline"),
    u64("loanSubmissionTime"),
])


const main = async()=>{
    const localenet = "http://127.0.0.1:8899";
    const connection = new Connection(localenet);    
    const programId = await createKeypairFromFile(PROGRAM_KEYPAIR_PATH);
    console.log("Pinging ... !");
    const alice = await createAccount(connection);
    let value = new Payload({
        id:0,
        loan: BigInt(260),
        deadline : BigInt(15)

    });
    let schema = new Map([
        [
            Payload,
          {
            kind: "struct",
            fields: [
              ["id" , "u8"],
              ["loan", "u64"],
              ["deadline", "u64"],
            ],
          },
        ],
    ]);
    console.log("Initialize the request for loan !");
    let nft_token_account : Keypair , nft_mint : PublicKey , borrower_token_account : Keypair , loan_token_mint : PublicKey;
    try{
        // borrower token account and mint - creating token account and mint of token which he wants to take as loan
        borrower_token_account = Keypair.generate();
        const borrower_token_account_inst = SystemProgram.createAccount({
            space: AccountLayout.span,
            lamports: await connection.getMinimumBalanceForRentExemption(
                AccountLayout.span
            ),
            fromPubkey: alice.publicKey,
            newAccountPubkey: borrower_token_account.publicKey,
            programId: TOKEN_PROGRAM_ID,
        });
        loan_token_mint = await createMint(connection,alice,alice.publicKey,alice.publicKey,0,undefined,undefined,TOKEN_PROGRAM_ID); 
        const initialize_borrower_token_account = createInitializeAccountInstruction(borrower_token_account.publicKey,loan_token_mint,alice.publicKey,TOKEN_PROGRAM_ID);
        
        // createing nft and token account which will be holding nft
        nft_token_account = Keypair.generate();
        const nft_token_account_inst = SystemProgram.createAccount({
            space: AccountLayout.span,
            lamports: await connection.getMinimumBalanceForRentExemption(
                AccountLayout.span
            ),
            fromPubkey: alice.publicKey,
            newAccountPubkey: nft_token_account.publicKey,
            programId: TOKEN_PROGRAM_ID,
        });
        nft_mint = await createMint(connection,alice,alice.publicKey,alice.publicKey,0,undefined,undefined,TOKEN_PROGRAM_ID);
        const initialize_nft_account = createInitializeAccount3Instruction(nft_token_account.publicKey,nft_mint,alice.publicKey,TOKEN_PROGRAM_ID);
        const mint_to_inst = createMintToInstruction(nft_mint,nft_token_account.publicKey,alice.publicKey,1,undefined,TOKEN_PROGRAM_ID);
        const tx1 = new Transaction();

        tx1.add(borrower_token_account_inst,initialize_borrower_token_account,nft_token_account_inst,initialize_nft_account,mint_to_inst);
        await sendAndConfirmTransaction(connection,tx1,[alice,nft_token_account,borrower_token_account]);
    }catch(e){
        console.log(e);
        return;
    }
    const loan_request_state = Keypair.generate();
    const create_request_account_inst = SystemProgram.createAccount({
        space: 1 + 32 + 32 + 32 + 32 + 32 + 32 + 8 + 8 + 8,
        lamports: await connection.getMinimumBalanceForRentExemption(
            1 + 32 + 32 + 32 + 32 + 32 + 32 + 8 + 8 + 8
        ),
        fromPubkey: alice.publicKey,
        newAccountPubkey: loan_request_state.publicKey,
        programId: programId.publicKey,
    })
    const [vault,_bump] = await PublicKey.findProgramAddress([Buffer.from("vault"),nft_mint.toBuffer()],programId.publicKey);
    const data = Buffer.from(serialize(schema,value));
    const transaction_inst = new TransactionInstruction({
        keys:[
            {pubkey:alice.publicKey,isSigner:true,isWritable:true},
            {pubkey:borrower_token_account.publicKey,isSigner:false,isWritable:false},
            {pubkey:loan_token_mint,isSigner:false,isWritable:false},
            {pubkey:nft_token_account.publicKey,isSigner:false,isWritable:true},
            {pubkey:nft_mint,isSigner:false,isWritable:false},
            {pubkey:vault,isSigner:false,isWritable:true},
            {pubkey:loan_request_state.publicKey,isSigner:false,isWritable:true},
            {pubkey:TOKEN_PROGRAM_ID,isSigner:false,isWritable:false},
            {pubkey:SYSVAR_RENT_PUBKEY,isSigner:false,isWritable:false},
        ],
        programId:programId.publicKey,
        data
    })
    const tx2 = new Transaction();
    tx2.add(create_request_account_inst,transaction_inst);
    await sendAndConfirmTransaction(connection,tx2,[alice,loan_request_state]);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    let loan_request_data_buffer = await connection.getAccountInfo(loan_request_state.publicKey);
    if (loan_request_data_buffer === null || loan_request_data_buffer.data.length === 0) {
        console.log("Request state account has not been initialized properly");
        process.exit(1);
    }
    let loan_request_state_data = REQUEST_LAYOUT.decode(loan_request_data_buffer.data);
    console.log("///////// Loan Request ! ///////////");
    loan_request_state_data.borrower.equals(alice.publicKey);
    loan_request_state_data.borrowerTokenAccount.equals(borrower_token_account.publicKey);
    loan_request_state_data.vault.equals(vault);
    loan_request_state_data.collateralNft.equals(nft_mint)
    loan_token_mint.equals(loan_request_state_data.principalToken);
    assert.equal(loan_request_state_data.deadline,15);
    assert.equal(loan_request_state_data.loanAmount,260);
    assert.equal(loan_request_state_data.isInitialized,1);

    console.log("initiate compelete the request by providing loan instruction !");
    value = new Payload({
        id:1,
        loan: BigInt(260),
        deadline : BigInt(15)
    });
    const bob = await createAccount(connection);
    const bob_token_account = Keypair.generate();
    const bob_token_account_inst = SystemProgram.createAccount({
        space: AccountLayout.span,
        lamports: await connection.getMinimumBalanceForRentExemption(
            AccountLayout.span
        ),
        fromPubkey: bob.publicKey,
        newAccountPubkey: bob_token_account.publicKey,
        programId: TOKEN_PROGRAM_ID,
    })
    
    const intialize_bob_token_account_inst = createInitializeAccountInstruction(bob_token_account.publicKey,loan_request_state_data.principalToken,bob.publicKey,TOKEN_PROGRAM_ID);
    const mint_to_bob_inst = createMintToInstruction(loan_request_state_data.principalToken,bob_token_account.publicKey,alice.publicKey,400,undefined,TOKEN_PROGRAM_ID);
    const transaction_inst_2  = new TransactionInstruction({
        keys:[
            {pubkey:bob.publicKey,isSigner:true,isWritable:true},
            {pubkey:borrower_token_account.publicKey,isSigner:false,isWritable:true},
            {pubkey:bob_token_account.publicKey,isSigner:false,isWritable:true},
            {pubkey:loan_request_state.publicKey,isSigner:false,isWritable:true},
            {pubkey:TOKEN_PROGRAM_ID,isSigner:false,isWritable:false},
            {pubkey:SYSVAR_CLOCK_PUBKEY,isSigner:false,isWritable:false},
        ],
        programId:programId.publicKey,
        data : Buffer.from(serialize(schema,value))
    });
    const tx3 = new Transaction();
    tx3.add(bob_token_account_inst,intialize_bob_token_account_inst,mint_to_bob_inst,transaction_inst_2);
    await sendAndConfirmTransaction(connection,tx3,[bob,alice,bob_token_account]);
    loan_request_data_buffer = await connection.getAccountInfo(loan_request_state.publicKey);
    if (loan_request_data_buffer === null || loan_request_data_buffer.data.length === 0) {
        console.log("Invalid State !");
        process.exit(1);
    }
    loan_request_state_data = REQUEST_LAYOUT.decode(loan_request_data_buffer.data);
    console.log("///////// Loan Request ! ///////////");
    loan_request_state_data.lender.equals(bob.publicKey);
    const slot = await connection.getSlot();
    const timestamp = await connection.getBlockTime(slot);
    if(timestamp)assert.equal(loan_request_state_data.loanSubmissionTime-BigInt(timestamp),BigInt(15))
    else {
        console.log("Timestamp not found for the ledger !");
        process.exit(1);
    }
    assert.equal(loan_request_state_data.isInitialized,2);
    const after_granting_loan_alice_token_acc_balance = await connection.getTokenAccountBalance(borrower_token_account.publicKey);
    assert.equal(after_granting_loan_alice_token_acc_balance.value.uiAmountString,"260");
}

main().then(
    ()=>process.exit(),
    err =>{
        console.log(err);
        process.exit(-1);
    }
)
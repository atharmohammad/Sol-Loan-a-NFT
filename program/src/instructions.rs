use crate::error::{self, LoanError};
use crate::id;
use borsh::{BorshDeserialize, BorshSerialize};
use solana_program::{
    instruction::{AccountMeta, Instruction},
    program_error::ProgramError,
    pubkey::Pubkey,
    sysvar::{self, rent},
};
#[derive(Debug, BorshDeserialize, BorshSerialize, Clone, PartialEq)]
pub struct Payload {
    pub variant: u8,
    pub arg1: u64,
    pub arg2: u64
}
#[derive(Debug, BorshDeserialize, BorshSerialize, Clone, PartialEq)]
pub enum LoanInstruction {
    /// Initialize request for a loan and provides with amount of loan required and deadline which can be followed
    /// accounts required :
    /// 0 - [signer] borrower who is initiating request for a loan
    /// 1 - [] borrower token account which will receive the loan
    /// 2 - [writer] token account which holds the nft
    /// 3 - [writer] mint of the collateral nft
    /// 4 - [writer] vault which will store the nft
    /// 5 - [writer] loan request state for the nft
    /// 6 - [] token program
    /// 7 - [] rent sysvar 
    InitializeRequest{
        loan_amount : u64,
        deadline : u64,
    }
}

// pub fn initialize(
//     user_sender: &Pubkey,
//     senders_token_account: &Pubkey,
//     escrow_token_account: &Pubkey,
//     escrow_account: &Pubkey,
//     rent: &Pubkey,
//     token_program: &Pubkey,
//     amount: u64,
// ) -> Instruction {
//     Instruction::new_with_borsh(
//         id(),
//         &EscrowInstruction::Initialize { amount },
//         vec![
//             AccountMeta::new(*user_sender, true),
//             AccountMeta::new(*senders_token_account, false),
//             AccountMeta::new(*escrow_token_account, false),
//             AccountMeta::new(*escrow_account, false),
//             AccountMeta::new(*rent, false),
//             AccountMeta::new(*token_program, false),
//         ],
//     )
// }
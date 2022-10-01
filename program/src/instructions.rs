use crate::error::{self, LoanError};
use crate::id;
use borsh::{BorshDeserialize, BorshSerialize};
use solana_program::{
    instruction::{AccountMeta, Instruction},
    program_error::ProgramError,
    pubkey::Pubkey,
    sysvar::{self, rent},
};
// #[derive(Debug, BorshDeserialize, BorshSerialize, Clone, PartialEq)]
// pub struct Payload {
//     pub variant: u8,
//     pub arg1: u64,
// }
#[derive(Debug, BorshDeserialize, BorshSerialize, Clone, PartialEq)]
pub enum LoanInstruction {
    Initialize{
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
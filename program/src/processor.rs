use crate::id;
use crate::state::*;
use crate::{error::LoanError, instructions::*};
use borsh::{BorshDeserialize, BorshSerialize};
use solana_program::{
    account_info::{next_account_info, AccountInfo},
    entrypoint::ProgramResult,
    msg,
    program::{invoke, invoke_signed},
    program_error::ProgramError,
    program_pack::Pack,
    pubkey::Pubkey,
    rent::Rent,
    sysvar::Sysvar,
};
use spl_token::instruction::close_account;
use spl_token::instruction::{set_authority, transfer};

pub fn process_instruction(
    _program_id: &Pubkey,
    accounts: &[AccountInfo],
    input: &[u8],
) -> ProgramResult {
    msg!("program starts!");
    let instruction = Payload::try_from_slice(input)?;
    match instruction.variant {
        0 => {
            msg!("Initialize request instruction starts !");
            let accounts_iter = &mut accounts.iter();
            let borrower = next_account_info(accounts_iter)?;
            let borrower_token_account = next_account_info(accounts_iter)?;
            let nft_holding_token_account = next_account_info(accounts_iter)?;
            let collateral_nft = next_account_info(accounts_iter)?;
            let vault = next_account_info(accounts_iter)?;
            let loan_request_state = next_account_info(accounts_iter)?;
            msg!("Deserialize the loan request state account!");
            let mut request_info = Request::unpack_unchecked(*loan_request_state.data.borrow())?;
            request_info.borrower = *borrower.key;
            request_info.borrower_token_account = *borrower_token_account.key;
            request_info.collateral_nft = *collateral_nft.key;
            request_info.is_initialized = 1;
            request_info.vault = *vault.key;
            request_info.loan_amount = instruction.arg1;
            request_info.deadline = instruction.arg2;
            msg!("Serialize the loan request state account after assigning the values");
            request_info.serialize(&mut &mut loan_request_state.data.borrow_mut()[..]);
            let token_program = next_account_info(accounts_iter)?;
            let rent = Rent::from_account_info(next_account_info(accounts_iter)?);
        },
        _ => return Err(ProgramError::InvalidArgument)
    }
    Ok(())
}
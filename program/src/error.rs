use solana_program::program_error::ProgramError;
use thiserror::Error;

#[derive(Error, Copy, Clone, Debug)]
pub enum LoanError {
    #[error("Invalid Data")]
    InvalidData,
    #[error("Invalid Instruction")]
    InvalidInstruction,
    #[error("Wrong Loan Amount Provided")]
    WrongLoanAmount,
    #[error("Loan Request Is Already Compeleted")]
    LoanRequestAlreadyCompeleted,
    #[error("Not Enough Balance To Provide Loan")]
    NotEnoughBalanceToProvideLoan,
    #[error("Loan Request has already Initiated")]
    RequestAlreadyInitialized,
}

impl From<LoanError> for ProgramError {
    fn from(e: LoanError) -> Self {
        ProgramError::Custom(e as u32)
    }
}

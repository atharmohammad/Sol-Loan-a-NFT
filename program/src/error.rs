use solana_program::program_error::ProgramError;
use thiserror::Error;

#[derive(Error, Copy, Clone, Debug)]
pub enum LoanError {
    #[error("Invalid Data")]
    InvalidData,
    #[error("Invalid Instruction")]
    InvalidInstruction,
}

impl From<LoanError> for ProgramError {
    fn from(e: LoanError) -> Self {
        ProgramError::Custom(e as u32)
    }
}
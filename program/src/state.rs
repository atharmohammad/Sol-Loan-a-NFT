use borsh::{BorshDeserialize, BorshSchema, BorshSerialize};
use solana_program::{
    msg,
    program_error::ProgramError,
    program_pack::{IsInitialized, Pack, Sealed},
    pubkey::Pubkey,
};

#[derive(Clone, Copy, Debug, BorshSerialize, BorshDeserialize, BorshSchema, PartialEq)]
pub struct Request {
    pub is_initialized: u8,             // 1
    pub borrower: Pubkey,               // 32
    pub borrower_token_account: Pubkey, // 32
    pub principal_token: Pubkey,        // 32
    pub collateral_nft: Pubkey,         // 32
    pub vault: Pubkey,                  // 32
    pub lender: Pubkey,                 // 32
    pub loan_amount: u64,               // 8
    pub deadline: u64,                  // 8
    pub loan_submission_time: u64,      // 8
}

impl Sealed for Request {}

impl Pack for Request {
    const LEN: usize = 1 + 32 + 32 + 32 + 32 + 32 + 32 + 8 + 8 + 8;

    fn pack_into_slice(&self, dst: &mut [u8]) {
        let mut slice = dst;
        self.serialize(&mut slice).unwrap()
    }

    fn unpack_from_slice(src: &[u8]) -> Result<Self, ProgramError> {
        let mut p = src;
        Request::deserialize(&mut p).map_err(|_| {
            msg!("Failed to deserialize name record");
            ProgramError::InvalidAccountData
        })
    }
}

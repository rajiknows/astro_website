---
title: "how to write a contract in anchor"
description: "Lets try to understand how to write a smart contract with a stablecoin project"
pubDate: "Jul 14 2025"
updatedDate: "Jul 14 2025"
heroImage: "/stablecoin.png"
---

## Preface
In this sort of tutorial style blog we will try to learn how to write a solana contract or a solana program as they like to say it.
for this we will chose the infamous **Anchor** framework, as it is the most beginnner friendly `well not so much, is it?`.
this blog is mainly for people who are already trying to learn anchor and thinking and searching of a guide on how to think about writing it.

### pre-requisite
1. you must know the basics of solana
- that includes:
    - you know the solana accounts model,
    - solana transactions and gas fee.

If you are not ready with these pre-requisites i'd suggest look into the official solana docs,
they have done a really good job on documentation .

**What are Stablecoins**
Stablecoins like USDC, USDT, and DAI are cryptocurrencies designed to maintain a stable value relative to a reference asset (usually USD). Unlike volatile cryptocurrencies, stablecoins provide the stability needed for practical use in DeFi applications.
Our stablecoin will follow the over-collateralized model:

1. *Deposit Collateral*: Users deposit SOL as collateral
2. *Mint Stablecoins*: Users can mint stablecoins worth less than their collateral value
3. *Over-collateralization*: Require 150% collateral ratio (deposit $150 SOL to mint $100 stablecoin)
4. *Liquidation Mechanism*: If collateral value drops too low, positions can be liquidated to maintain system health
5. *Oracle Integration*: Use Pyth oracles for real-time price feeds
6. *Administrative Controls*: Config management and emergency functions

Now let's dive into the actual implementation!

## Setting Up The Project Structure

When you start an Anchor project, you'll notice it creates a specific structure. For our stablecoin, here's how I organized the code:

```
└── programs/
    └── stablecoin/
        ├── src/
        │   ├── constants.rs      // All our magic numbers
        │   ├── lib.rs           // Main program entry point
        │   ├── state.rs         // Account structures
        │   └── instructions/    // All our instruction logic
        │       ├── admin/       // Admin functions
        │       └── user/        // User functions
```

This structure helps keep things organized. Trust me, you don't want all your code in one giant file!

## The Anchor Mental Model

Before diving into code, understand that every Anchor program follows this pattern:

1. **lib.rs** - Your program's public API (the instructions users can call)
2. **state.rs** - Your data structures (what gets stored on-chain)
3. **instructions/** - The business logic for each operation
4. **Account Validation** - Ensuring security through the type system

Think of it like a web API: lib.rs defines your endpoints, state.rs defines your database schema, and instructions/ contains your route handlers.

## Understanding lib.rs: Your Program's Interface

```rust
declare_id!("YourProgramIdHere111111111111111111111111111");

#[program]
pub mod stablecoin {
    use super::*;

    pub fn initialize_config(
        ctx: Context<InitializeConfig>,
        liquidation_threshold: u64,
        liquidation_bonus: u64,
        min_health_factor: u64,
    ) -> Result<()> {
        process_initialize_config(ctx, liquidation_threshold, liquidation_bonus, min_health_factor)
    }

    pub fn deposit_collateral(ctx: Context<DepositCollateral>, amount: u64) -> Result<()> {
        process_deposit_collateral(ctx, amount)
    }

    pub fn mint_stablecoin(ctx: Context<MintStablecoin>, amount: u64) -> Result<()> {
        process_mint_stablecoin(ctx, amount)
    }

    pub fn liquidate(
        ctx: Context<Liquidate>,
        amount_to_repay: u64,
    ) -> Result<()> {
        process_liquidate(ctx, amount_to_repay)
    }
}
```

**Key Pattern**: Every function takes a `Context<T>` as the first parameter. This Context contains all the accounts needed for that instruction. Additional parameters are the instruction data.

**Delegation Pattern**: Keep lib.rs clean by delegating to `process_*` functions. This makes your code maintainable and testable.

## State Management: The #[account] Macro

```rust
#[account]
#[derive(InitSpace, Debug)]
pub struct Config {
    pub authority: Pubkey,           // 32 bytes
    pub mint: Pubkey,               // 32 bytes
    pub liquidation_threshold: u64, // 8 bytes
    pub liquidation_bonus: u64,     // 8 bytes
    pub min_health_factor: u64,     // 8 bytes
    pub emergency_mode: bool,       // 1 byte
    pub bump: u8,                   // 1 byte
    pub bump_mint_account: u8,      // 1 byte
}
```

### What #[account] Does:
1. **Adds 8-byte discriminator** - Identifies the account type
2. **Implements serialization** - Handles data storage/retrieval
3. **Adds owner validation** - Ensures your program owns the account
4. **Space calculation** - Works with `InitSpace` to calculate required space

### When to Use Each Derive:
- `InitSpace` - **Always use this** for automatic space calculation
- `Debug` - For development and testing
- `PartialEq` - When you need to compare accounts
- `Default` - When you want default values

## Account Types: Choosing the Right Tool

### Account<'info, T> - Go-To Choice
```rust
#[account(mut)]
pub config: Account<'info, Config>,
```
Working with custom program accounts

### InterfaceAccount<'info, T> - For SPL Tokens
```rust
#[account(mut)]
pub mint_account: InterfaceAccount<'info, Mint>,

#[account(
    mut,
    token::mint = mint_account,
    token::authority = user
)]
pub token_account: InterfaceAccount<'info, TokenAccount>,
```
**when to use**: Working with SPL tokens (mints, token accounts). Supports both Token and Token2022 programs.

### SystemAccount<'info> - For Native SOL
```rust
#[account(mut)]
pub sol_vault: SystemAccount<'info>,
```
**when to use**: Storing or transferring native SOL


### Signer<'info> - For Transaction Signers
```rust
#[account(mut)]
pub authority: Signer<'info>,
```
**when to use**: Account must have signed the transaction

### UncheckedAccount<'info> - Use Sparingly
```rust
/// CHECK: Validated by Pyth SDK
pub pyth_price_feed: UncheckedAccount<'info>,
```
**when to use**: Working with external programs where you'll validate manually. **Always add a comment explaining why it's safe (it the best practise)**.

## The #[account] Constraint System: Your Security Layer

This is where Anchor really shines. Instead of manual validation, you declare your requirements:

### Initialization Constraints
```rust
#[account(
    init,                           // Create new account
    payer = authority,              // Who pays rent
    space = 8 + Config::INIT_SPACE, // How much space
    seeds = [SEED_ACCOUNT],         // PDA seeds
    bump,                           // Canonical bump
)]
pub config: Account<'info, Config>,
```

### Relationship Validation
```rust
#[account(
    mut,
    has_one = authority @ ErrorCode::Unauthorized,     // config.authority == authority
    has_one = depositor_addr @ ErrorCode::WrongUser,   // collateral.depositor_addr == depositor_addr
)]
pub collateral: Account<'info, Collateral>,
```

### Custom Business Logic
```rust
#[account(
    mut,
    constraint = collateral.is_initialized @ ErrorCode::NotInitialized,
    constraint = amount > MIN_DEPOSIT @ ErrorCode::DepositTooSmall,
    constraint = !config.emergency_mode @ ErrorCode::EmergencyActive,
)]
pub collateral: Account<'info, Collateral>,
```

### Token-Specific Constraints
```rust
#[account(
    mut,
    token::mint = mint_account,     // Must be associated with this mint
    token::authority = user,        // User must own this token account
)]
pub user_token_account: InterfaceAccount<'info, TokenAccount>,

#[account(
    init,
    payer = authority,
    mint::decimals = 9,             // 9 decimal places
    mint::authority = config,       // Config account can mint
    mint::freeze_authority = config, // Config account can freeze
)]
pub mint: InterfaceAccount<'info, Mint>,
```

### PDA (Program Derived Address) Constraints
```rust
#[account(
    mut,
    seeds = [SEED_COLLATERAL, user.key().as_ref()], // Deterministic address
    bump = collateral.bump,                         // Stored bump value
)]
pub collateral: Account<'info, Collateral>,
```

## Practical Example: Deposit Collateral Instruction

Let's see how all these concepts work together:

```rust
#[derive(Accounts)]
pub struct DepositCollateral<'info> {
    #[account(mut)]
    pub depositor: Signer<'info>,

    #[account(
        mut,
        seeds = [SEED_COLLATERAL, depositor.key().as_ref()],
        bump = collateral_account.bump,
        has_one = depositor_addr @ ErrorCode::DepositorMismatch,
        constraint = collateral_account.is_initialized @ ErrorCode::NotInitialized
    )]
    pub collateral_account: Account<'info, Collateral>,

    #[account(
        mut,
        seeds = [SEED_SOL_VAULT, depositor.key().as_ref()],
        bump = collateral_account.bump_sol_account,
    )]
    pub sol_account: SystemAccount<'info>,

    pub system_program: Program<'info, System>,
}

pub fn process_deposit_collateral(ctx: Context<DepositCollateral>, amount: u64) -> Result<()> {
    // Input validation
    require!(amount >= MIN_DEPOSIT_AMOUNT, ErrorCode::DepositTooSmall);

    // Safe math - always use checked operations
    let new_balance = ctx.accounts.collateral_account.lamport_balance
        .checked_add(amount)
        .ok_or(ErrorCode::Overflow)?;

    // Cross-program invocation (CPI) to transfer SOL
    let cpi_context = CpiContext::new(
        ctx.accounts.system_program.to_account_info(),
        anchor_lang::system_program::Transfer {
            from: ctx.accounts.depositor.to_account_info(),
            to: ctx.accounts.sol_account.to_account_info(),
        },
    );
    anchor_lang::system_program::transfer(cpi_context, amount)?;

    // Update state only after successful transfer
    ctx.accounts.collateral_account.lamport_balance = new_balance;
    Ok(())
}
```

### Breaking Down the Security:
1. **depositor**: Must be a signer (they initiated the transaction)
2. **collateral_account**: Must be the correct PDA for this user, must be initialized
3. **sol_account**: Must be the correct vault PDA for storing SOL
4. **Validation**: Amount must meet minimum, math must not overflow
5. **State update**: Only happens after successful transfer

## Essential Patterns Every Contract Uses

### 1. The PDA Pattern
```rust
// Constants
pub const SEED_COLLATERAL: &[u8] = b"collateral";

// In your account structure
#[account(
    seeds = [SEED_COLLATERAL, user.key().as_ref()],
    bump = collateral.bump,  // Store the bump!
)]
pub collateral: Account<'info, Collateral>,

// In your state
pub struct Collateral {
    pub bump: u8,  // Always store bumps
    // ... other fields
}
```
**Why**: PDAs give you deterministic addresses that your program controls

### 2. The CPI (Cross-Program Invocation) Pattern
```rust
// For system program calls
let cpi_context = CpiContext::new(
    ctx.accounts.system_program.to_account_info(),
    anchor_lang::system_program::Transfer {
        from: user.to_account_info(),
        to: vault.to_account_info(),
    },
);
anchor_lang::system_program::transfer(cpi_context, amount)?;

// For token program calls
let cpi_context = CpiContext::new(
    ctx.accounts.token_program.to_account_info(),
    anchor_spl::token_interface::MintTo {
        mint: mint.to_account_info(),
        to: token_account.to_account_info(),
        authority: config.to_account_info(),
    },
);
anchor_spl::token_interface::mint_to(cpi_context, amount)?;
```

### 3. The PDA Signer Pattern
```rust
// When your program needs to sign (e.g., as mint authority)
let seeds = &[SEED_CONFIG, &[config.bump]];
let signer = &[&seeds[..]];

let cpi_context = CpiContext::new_with_signer(
    ctx.accounts.token_program.to_account_info(),
    MintTo { /* accounts */ },
    signer,  // Program signs with PDA
);
```

### 4. The Safe Math Pattern
```rust
// NEVER do this
let result = a + b;  // Can overflow!

// ALWAYS do this
let result = a.checked_add(b).ok_or(ErrorCode::Overflow)?;

// For percentage calculations (avoid floating point)
let collateral_ratio = collateral_value
    .checked_mul(100)
    .ok_or(ErrorCode::Overflow)?;

require!(
    collateral_ratio >= debt_value.checked_mul(REQUIRED_RATIO)?,
    ErrorCode::InsufficientCollateral
);
```

## Common Mistakes and How to Avoid Them

### Don't: Skip input validation
```rust
pub fn bad_function(ctx: Context<Example>, amount: u64) -> Result<()> {
    // Directly using amount without validation
    ctx.accounts.balance += amount;  // What if amount is 0? Or MAX_U64?
    Ok(())
}
```

### Do: Validate everything
```rust
pub fn good_function(ctx: Context<Example>, amount: u64) -> Result<()> {
    require!(amount > 0, ErrorCode::InvalidAmount);
    require!(amount <= MAX_DEPOSIT, ErrorCode::ExceedsLimit);

    let new_balance = ctx.accounts.balance
        .checked_add(amount)
        .ok_or(ErrorCode::Overflow)?;

    ctx.accounts.balance = new_balance;
    Ok(())
}
```

### Don't: Forget to store bump seeds
```rust
#[account]
pub struct BadConfig {
    pub authority: Pubkey,
    // Missing bump! How will you recreate the PDA later?
}
```

### Do: Always store bumps
```rust
#[account]
pub struct GoodConfig {
    pub authority: Pubkey,
    pub bump: u8,  // Essential for PDA recreation
}
```

### Don't: Use floating point math
```rust
let ratio = (collateral as f64) / (debt as f64);  // Precision issues!
```

### Do: Use cross multiplication
```rust
let collateral_ratio = collateral.checked_mul(100)?;
require!(collateral_ratio >= debt.checked_mul(150)?, ErrorCode::InsufficientCollateral);
```

## Testing Your Understanding

Here's a quick mental checklist when reading any Anchor contract:

1. **lib.rs**: What instructions can users call?
2. **State structs**: What data is stored? Are bumps stored?
3. **Account constraints**: How is security enforced?
4. **Account types**: Are the right types used for each use case?
5. **Validation**: Is input validated? Math checked for overflow?
6. **CPIs**: Are external program calls handled correctly?

## Beyond the Basics

Once you master these fundamentals, you'll want to explore:

- **Events and logging** for off-chain indexing
- **Upgradeability patterns** for contract evolution
- **Oracle integration** for external data
- **Advanced PDA patterns** for complex relationships
- **Optimization techniques** for transaction costs

## Complete Code Reference

The full stablecoin implementation with all advanced features (liquidation, oracles, emergency controls) is available on GitHub: [https://github.com/rajiknows/stablecoin]

This tutorial covered the essential 80% of concepts you'll use in 95% of contracts. Master these patterns, and you'll be able to read, write, and understand any Anchor codebase with confidence.

## Final Thoughts

Anchor's power lies in its constraint system - you declare your security requirements, and the framework enforces them. This shifts your thinking from "How do I validate this?" to "What should be true for this operation to be safe?"

Once you internalize this mindset, writing Solana programs becomes about modeling your business logic with the right account structures and constraints. The framework handles the rest.

Now go build something amazing!

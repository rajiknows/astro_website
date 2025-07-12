---
title: "Understanding Lifetimes in Rust"
description: "Understanding lifetimes in Rust with a simple example"
pubDate: "Mar 21 2025"
updatedDate: "Mar 21 2025"  # Add this line
heroImage: "/does_not_compile.svg"
---

Alright, so you must have been wondering what these `<'a>` signs are all over a Rust codebase you may have seen on GitHub. Well, these are called lifetimes in Rust.

## What are lifetimes?
Lifetimes are a way of telling the Rust compiler how long a reference to a value is valid. This is important because Rust needs to know when it can safely deallocate memory that is no longer needed.

I know this is a very abstract way of putting it, so let's look into it with an example.

Let's say I have a struct `Owner`, which has a name and a vector of tools he owns:

```rust
#[derive(Debug)]
struct Owner {
    name: String,
    tools: Vec<Tool>,
}
```

Alright, so let's create the `Tool` struct as well:

```rust
#[derive(Debug)]
struct Tool {
    name: String,
    owner: Owner,
}
```

Now, let's write the `main` function and try some things out:

```rust
fn main() {
    let mut owner = Owner {
        name: String::from("John"),
        tools: Vec::new(),
    };

    let tool = Tool {
        name: String::from("Hammer"),
        owner: owner,
    };

    owner.tools.push(tool);
    println!("{:?}", owner);
}
```

This code runs fine with no compiler errors.

Now, let's say the owner has more than one tool, so we add another tool:

```rust
fn main() {
    let mut owner = Owner {
        name: String::from("John"),
        tools: Vec::new(),
    };

    let tool = Tool {
        name: String::from("Hammer"),
        owner: owner,
    };

    owner.tools.push(tool);

    let tool2 = Tool {
        name: String::from("Screwdriver"),
        owner: owner,
    };

    owner.tools.push(tool2);
    println!("{:?}", owner);
}
```

Here comes the tricky part: this code will **not** compile and will give you an error.

If you understand Rust's borrowing and ownership rules, you may have already guessed the issue. The error occurs because `owner` is **moved** into the first tool, and then we try to use it again for the second tool, which is **not allowed**.

### How do we fix this?

The first idea that comes to mind is making the `owner` field in the `Tool` struct a **reference**, so it can be used in multiple tools:

```rust
#[derive(Debug)]
struct Tool {
    name: String,
    owner: &Owner,
}
```

Now, let's write the `main` function again:

```rust
#[derive(Debug)]
struct Tool {
    name: String,
    owner: &Owner,
}

fn main() {
    let mut owner = Owner {
        name: String::from("John"),
        tools: Vec::new(),
    };

    let tool = Tool {
        name: String::from("Hammer"),
        owner: &owner,
    };

    owner.tools.push(tool);

    let tool2 = Tool {
        name: String::from("Screwdriver"),
        owner: &owner,
    };

    owner.tools.push(tool2);
    println!("{:?}", owner);
}
```

So, this should just work, right? **Nope.**

This will give another error because the reference to `owner` is not valid when stored inside `tools`. The issue is that `owner` is dropped at the end of `main`, making all references invalid.

### Enter Lifetimes

This is where **lifetimes** come into play. We can tell the Rust compiler that the reference to `owner` in `Tool` is valid for as long as `Owner` exists.

Let's add a lifetime annotation to `Tool`:

```rust
#[derive(Debug)]
struct Tool<'a> {
    name: String,
    owner: &'a Owner,
}
```

This means that the reference to `owner` is valid for the same lifetime as `Owner`.

Now, `Owner` also needs a lifetime annotation because it stores a vector of `Tool` structs that contain references:

```rust
#[derive(Debug)]
struct Owner<'a> {
    name: String,
    tools: Vec<Tool<'a>>,
}
```

### Final Working Code

```rust
#[derive(Debug)]
struct Owner<'a> {
    name: String,
    tools: Vec<Tool<'a>>,
}

#[derive(Debug)]
struct Tool<'a> {
    name: String,
    owner: &'a Owner<'a>,
}

fn main() {
    let mut owner = Owner {
        name: String::from("John"),
        tools: Vec::new(),
    };

    let tool = Tool {
        name: String::from("Hammer"),
        owner: &owner,
    };

    owner.tools.push(tool);

    let tool2 = Tool {
        name: String::from("Screwdriver"),
        owner: &owner,
    };

    owner.tools.push(tool2);
    println!("{:?}", owner);
}
```

And now, this code compiles and runs **without errors**!

This was a simple example, but lifetimes can get complex in larger codebases. Understanding these basics will help you deal with more advanced lifetime scenarios effectively.

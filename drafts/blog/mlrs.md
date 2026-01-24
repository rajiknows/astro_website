---
title: "mlrs vol 1"
description: "writing a deep learning library from scratch"
pubDate: "Jan 19 2026"
updatedDate: "Jan 19 2026"
heroImage: "./stablecoin-anchor.md"
---


In this blog i will share my journey of making a deep learning lib from scratch and why it is important that you
should also take this challange.

so most of the mathematics in machine learning is just matrix operations , now the most important thing is how do you represent a *Matrix*, sure you can with the
obvious pattern of having a vector of vectors where each vector inside the outer vector are rows. something like this

```rust
struct Matrix {
 data: Vec<Vec<f32>>
}
```

but this design is very naive, how about we have a single vector and we save informations of rows and cols in the matrix struct, something like this:

```rust
struct Matrix{
 rows: usize,
 cols: usize,
 data: Vec<f32>,
}
```

Since the matrix is stored in row-major order, a 2D index `[row][col]`
maps to a 1D index using:

`index = row * cols + col`

For example, element `[12][13]` becomes:

`12 * cols + 13`

now you may have this question as to why is this a better design

you see `Vec<f32>` is contiguous memory
now `Vec<Vec<f32>>` is contiguous pointers in which the pointers are placed anywhere in the memory, so you are basically chasing pointers
that adds up to the more overhead for the cpu.

alright so we got our matrix struct , now all you need is: add all the f'in operations that are associated with matrix
some of these are

- Add (matrix a, matrix b)
- Sub (matrix a, matrix b)
- ScalerMul( matrix a , matrix b)
- ScalerMul( matrix a , matrix b)
- ScalerMul( matrix a , matrix b)
- ScalerMul( matrix a , matrix b)
- ScalerMul( matrix a , matrix b)

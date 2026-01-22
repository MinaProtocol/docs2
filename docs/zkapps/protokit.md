# Protokit

## Introduction to Protokit 

Protokit is a **development framework for building zkApps** requiring shared state. Built on top of o1js, Protokit simplifies the developer experience, increases throughput, and decreases latency by orchestrating state transitions between an off-chain sequencer and the Mina L1.

Further features, such as runtime abstractions and merkelized data storage, provide components out of the box that zkApp developers would otherwise have to build on top of o1js. 

**Please note that Protokit is in alpha, and settlement support with reorgs is still in progress.**


<table>
  <tr>
   <td>Info
   </td>
  </tr>
  <tr>
   <td>Protokit dramatically simplifies the development experience for Mina’s <a href="https://docs.minaprotocol.com/zkapps/writing-a-zkapp/feature-overview/actions-and-reducer">Actions & Reducers</a>, enabling zkApp developers to build more complex applications. 
   </td>
  </tr>
</table>



## Key benefits of using Protokit

**Concurrency:** Solves concurrency issues for applications with shared state through a novel hybrid execution model.

**Performance**: Improves throughput (TPS) and latency on block production while maintaining Mina L1’s security.

**Developer Experience:** Saves developers writing thousands of lines of code by providing an integrated, verifiable storage solution.

**Flexibility:** Provides a modular architecture that developers can easily customize for their own application’s needs. 

**Zero Knowledge:** Uses the same primitives and proofs as o1js, so Protokit code is provable and compatible with the Mina blockchain by design. 


## When to use Protokit

Protokit is well-suited for high-throughput zkApps with multiple concurrent users and applications requiring shared state.

Use Protokit for:



* DEXes
* Lending protocols
* Gaming
* Lotteries
* NFT marketplaces
* Anything that needs a shared state

Choosing [which Protokit mode to use](https://docs.minaprotocol.com/zkapps/zkapp-development-frameworks) (Based Sequencing or Hybrid Sequencing mode) depends on what you’re looking to optimize for in your own zkApp. 

Start here:



* [zkApp development frameworks (when to use Protokit vs. o1js)](https://docs.minaprotocol.com/zkapps/zkapp-development-frameworks)
* [Developer documentation](https://protokit.dev/docs/what-is-protokit)
* [Protokit repository](https://github.com/proto-kit)
* [Starter Kit](https://github.com/proto-kit/starter-kit)


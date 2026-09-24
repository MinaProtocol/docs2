# zkApp: Recursion

You build recursive zkApps by using ZkProgram, the o1js general purpose API for creating zero knowledge proofs. 

A ZkProgram is similar to zkApp smart contracts but isn't tied to an on-chain account. This tutorial code is an example of a simple zkRollup. This tutorial guides you through a review of a simple zkRollup example that can be used to implement a zkRollup or an app chain.

## Tutorial

For the step-by-step tutorial, see [Tutorial 9: Recursion](https://docs.minaprotocol.com/zkapps/tutorials/recursion).

## How to install and run this example project

1. Clone the repository:
    ```sh
    git clone https://github.com/o1-labs/docs2.git
    ```
2. Change directory to the project location:
    ```sh
    cd docs2/examples/zkapps/09-recursion
    ```
3. Install dependencies:
    ```sh
    npm install
    ```

4. Build the project:
    ```sh
    npm run build
    ```

5. Run the compiled code:
    ```sh
    node build/src/main.js
    ```
    To run and build the compiled code with a single command:
    ```sh
    npm run build && node build/src/main.js
    ```
    The voting and rollup examples run the same way, with
    `node build/src/vote.js` and `node build/src/rollup.js`.

6. Run the tests:
    ```sh
    npm test
    ```

## License

[Apache-2.0](LICENSE)


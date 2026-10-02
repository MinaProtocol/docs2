# zkApp: Interacting with zkApps server-side

Use a script to initialize the state and interact with it. See [Interacting with zkApps server-side](https://docs.minaprotocol.com/zkapps/tutorials/interacting-with-zkapps-server-side).

## How to install and run this example project

1. Clone the repository:
    ```sh
    git clone https://github.com/MinaProtocol/docs2.git
    ```
2. Change directory to the project location:
    ```sh
    cd docs2/examples/zkapps/interacting-with-zkApps-server-side
    ```
3. Install dependencies:
    ```sh
    npm install
    ```

4. Build the project:
    ```sh
    npm run build
    ```

5. Run the same flow on a local blockchain. It needs no network, no funds and no keys:
    ```sh
    npm start
    ```

6. Run the script against Devnet. Run it from a project where `zk config` created a deploy alias (for example `devnet`) and where `zk deploy` deployed the `Square` contract. The fee payer account must have tMINA:
    ```sh
    npm run build && node build/src/main.js devnet
    ```

## License

[Apache-2.0](LICENSE)
import { Mina, PublicKey, fetchAccount } from 'o1js';
import * as Comlink from "comlink";
import type { Add } from '../../contracts/src/Add';

type Transaction = Awaited<ReturnType<typeof Mina.transaction>>;

const state = {
  AddInstance: null as null | typeof Add,
  zkappInstance: null as null | Add,
  transaction: null as null | Transaction,
};

export const api = {
  async setActiveInstanceToDevnet() {
    const Network = Mina.Network('https://api.minascan.io/node/devnet/v1/graphql');
    console.log('Devnet network instance configured');
    Mina.setActiveInstance(Network);
  },
  async loadContract() {
    const { Add } = await import('../../contracts/build/src/Add.js');
    state.AddInstance = Add;
  },
  async compileContract() {
    await state.AddInstance!.compile();
  },
  async fetchAccount(publicKey58: string) {
    const publicKey = PublicKey.fromBase58(publicKey58);
    return fetchAccount({ publicKey });
  },
  async initZkappInstance(publicKey58: string) {
    const publicKey = PublicKey.fromBase58(publicKey58);
    state.zkappInstance = new state.AddInstance!(publicKey);
  },
  async getNum() {
    const currentNum = await state.zkappInstance!.num.get();
    return JSON.stringify(currentNum.toJSON());
  },
  async createUpdateTransaction() {
    state.transaction = await Mina.transaction(async () => {
      await state.zkappInstance!.update();
    });
  },
  async proveUpdateTransaction() {
    await state.transaction!.prove();
  },
  async getTransactionJSON() {
    return state.transaction!.toJSON();
  },
};

// Expose the API to be used by the main thread
Comlink.expose(api);

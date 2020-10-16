#!/usr/bin/env bash

sleep 5 && truffle deploy --network development --reset &
npx ganache-cli --mnemonic "drama obscure around omit goose hammer ostrich gift inner dress talent expand" --gasLimit 0xfffffffffff --networkId 1337 --port 8545



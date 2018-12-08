#!/bin/bash

all_steps=( $@ )

for file in "${all_steps[@]}"; do
  buffer="$(cat $file | sed 's/async t/t/g' | sed 's/await t/return t/g')"
  echo "$buffer" > $file
done

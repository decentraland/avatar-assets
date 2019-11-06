#!/bin/sh

find assets -name '.DS_Store' | xargs rm

find assets -type d | xargs rmdir 

make gentest



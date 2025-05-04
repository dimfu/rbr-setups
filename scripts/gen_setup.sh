#!/bin/bash

awk '
function strip_suffix(key, suffix,   base) {
    gsub("_NGP$", "", key)  # remove _NGP first if present
    base = key
    sub(suffix "$", "", base)  # remove Max/Min/Step suffix
    return base
}

{
    gsub(/[[:space:]]+/, "", $1)
    if ($1 ~ /(Max|Min|Step)(_NGP)?$/) {
        key = $1
        if (key ~ /Max(_NGP)?$/) {
            base = strip_suffix(key, "Max")
            data[base]["max"] = key
        } else if (key ~ /Min(_NGP)?$/) {
            base = strip_suffix(key, "Min")
            data[base]["min"] = key
        } else if (key ~ /Step(_NGP)?$/) {
            base = strip_suffix(key, "Step")
            data[base]["step"] = key
        }
    }
}
END {
    out = "opts_1.txt"
    print "[" > out
    sep = ""
    for (base in data) {
        print sep "  {" >> out
        print "    \"max\": \"" data[base]["max"] "\"," >> out
        print "    \"min\": \"" data[base]["min"] "\"," >> out
        print "    \"step\": \"" data[base]["step"] "\"" >> out
        print "  }" >> out
        sep = ","
    }
    print "]" >> out
}
' <<< "$(cat)"

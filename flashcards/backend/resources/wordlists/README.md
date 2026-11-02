# Word lists

`english.txt.gz` is ENABLE (Enhanced North American Benchmark LEXicon), about
173,000 lowercase English words, one per line. ENABLE is in the public domain.
Source: https://github.com/dolph/dictionary (`enable1.txt`), gzipped.

`App\Services\Text\EnglishWords` uses it when repairing PDF text, to tell real
words from fragments.

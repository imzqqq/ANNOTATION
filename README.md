# Demirjian's Marking Tool

Flask framework is adopted for development, B/S based interaction, and multi-marker tagging is supported.

## Feature
* B/S mode of interaction
* Support multiple people to mark at the same time(can assign mark scope of different mark person, or different mark category of different mark person)
* Category selection eliminates manual input of categories
* Support drag and drop to correct annotation areas
* Support for multi-category and multi-objective annotations


## Usage
1. Install environment dependencies according to `requirements.txt`

```build
$ python3.8 -m venv env
$ pip3 install -r requirements.txt
$ flask initdb  (optional arg: --drop, for the first time use only)
$ flask run
```

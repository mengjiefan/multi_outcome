import os, json
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import hypernetx as hnx
from networkx import fruchterman_reingold_layout as layout

scenes = {
    0: ('FN', 'TH'),
    1: ('TH', 'JV'),
    2: ('BM', 'FN', 'JA'),
    3: ('JV', 'JU', 'CH', 'BM'),
    4: ('JU', 'CH', 'BR', 'CN', 'CC', 'JV', 'BM'),
    5: ('TH', 'GP'),
    6: ('GP', 'MP'),
    7: ('MA', 'GP')
}

H = hnx.Hypergraph(scenes)
hnx.drawing.draw(H)
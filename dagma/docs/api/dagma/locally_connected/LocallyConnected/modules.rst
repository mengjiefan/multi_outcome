:py:meth:`dagma.locally_connected.LocallyConnected.modules <dagma.locally_connected.LocallyConnected.modules>`
==============================================================================================================
.. _dagma.locally_connected.LocallyConnected.modules:
.. py:method:: dagma.locally_connected.LocallyConnected.modules() -> Iterator[Module]

   Returns an iterator over all modules in the network.

   :Yields: *Module* -- a module in the network

   .. note::

      Duplicate modules are returned only once. In the following
      example, ``l`` will be returned only once.

   Example::

       >>> l = nn.Linear(2, 2)
       >>> net = nn.Sequential(l, l)
       >>> for idx, m in enumerate(net.modules()):
       ...     print(idx, '->', m)

       0 -> Sequential(
         (0): Linear(in_features=2, out_features=2, bias=True)
         (1): Linear(in_features=2, out_features=2, bias=True)
       )
       1 -> Linear(in_features=2, out_features=2, bias=True)





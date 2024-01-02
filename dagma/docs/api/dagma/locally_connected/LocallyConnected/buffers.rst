:py:meth:`dagma.locally_connected.LocallyConnected.buffers <dagma.locally_connected.LocallyConnected.buffers>`
==============================================================================================================
.. _dagma.locally_connected.LocallyConnected.buffers:
.. py:method:: dagma.locally_connected.LocallyConnected.buffers(recurse: bool = True) -> Iterator[torch.Tensor]

   Returns an iterator over module buffers.

   :param recurse: if True, then yields buffers of this module
                   and all submodules. Otherwise, yields only buffers that
                   are direct members of this module.
   :type recurse: bool

   :Yields: *torch.Tensor* -- module buffer

   Example::

       >>> # xdoctest: +SKIP("undefined vars")
       >>> for buf in model.buffers():
       >>>     print(type(buf), buf.size())
       <class 'torch.Tensor'> (20L,)
       <class 'torch.Tensor'> (20L, 1L, 5L, 5L)





:py:meth:`dagma.locally_connected.LocallyConnected.ipu <dagma.locally_connected.LocallyConnected.ipu>`
======================================================================================================
.. _dagma.locally_connected.LocallyConnected.ipu:
.. py:method:: dagma.locally_connected.LocallyConnected.ipu(device: Optional[Union[int, Module.ipu.device]] = None) -> T

   Moves all model parameters and buffers to the IPU.

   This also makes associated parameters and buffers different objects. So
   it should be called before constructing optimizer if the module will
   live on IPU while being optimized.

   .. note::
       This method modifies the module in-place.

   :param device: if specified, all parameters will be
                  copied to that device
   :type device: int, optional

   :returns: self
   :rtype: Module




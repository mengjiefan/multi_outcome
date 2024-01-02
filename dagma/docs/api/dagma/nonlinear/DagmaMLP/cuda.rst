:py:meth:`dagma.nonlinear.DagmaMLP.cuda <dagma.nonlinear.DagmaMLP.cuda>`
========================================================================
.. _dagma.nonlinear.DagmaMLP.cuda:
.. py:method:: dagma.nonlinear.DagmaMLP.cuda(device: Optional[Union[int, Module.cuda.device]] = None) -> T

   Moves all model parameters and buffers to the GPU.

   This also makes associated parameters and buffers different objects. So
   it should be called before constructing optimizer if the module will
   live on GPU while being optimized.

   .. note::
       This method modifies the module in-place.

   :param device: if specified, all parameters will be
                  copied to that device
   :type device: int, optional

   :returns: self
   :rtype: Module




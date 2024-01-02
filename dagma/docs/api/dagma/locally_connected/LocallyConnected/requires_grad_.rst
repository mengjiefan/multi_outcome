:py:meth:`dagma.locally_connected.LocallyConnected.requires_grad_ <dagma.locally_connected.LocallyConnected.requires_grad_>`
============================================================================================================================
.. _dagma.locally_connected.LocallyConnected.requires_grad_:
.. py:method:: dagma.locally_connected.LocallyConnected.requires_grad_(requires_grad: bool = True) -> T

   Change if autograd should record operations on parameters in this
   module.

   This method sets the parameters' :attr:`requires_grad` attributes
   in-place.

   This method is helpful for freezing part of the module for finetuning
   or training parts of a model individually (e.g., GAN training).

   See :ref:`locally-disable-grad-doc` for a comparison between
   `.requires_grad_()` and several similar mechanisms that may be confused with it.

   :param requires_grad: whether autograd should record operations on
                         parameters in this module. Default: ``True``.
   :type requires_grad: bool

   :returns: self
   :rtype: Module




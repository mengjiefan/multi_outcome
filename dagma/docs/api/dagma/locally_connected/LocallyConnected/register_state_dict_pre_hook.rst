:py:meth:`dagma.locally_connected.LocallyConnected.register_state_dict_pre_hook <dagma.locally_connected.LocallyConnected.register_state_dict_pre_hook>`
========================================================================================================================================================
.. _dagma.locally_connected.LocallyConnected.register_state_dict_pre_hook:
.. py:method:: dagma.locally_connected.LocallyConnected.register_state_dict_pre_hook(hook)

   These hooks will be called with arguments: ``self``, ``prefix``,
   and ``keep_vars`` before calling ``state_dict`` on ``self``. The registered
   hooks can be used to perform pre-processing before the ``state_dict``
   call is made.




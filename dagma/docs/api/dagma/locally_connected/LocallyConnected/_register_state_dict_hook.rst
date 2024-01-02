:py:meth:`dagma.locally_connected.LocallyConnected._register_state_dict_hook <dagma.locally_connected.LocallyConnected._register_state_dict_hook>`
==================================================================================================================================================
.. _dagma.locally_connected.LocallyConnected._register_state_dict_hook:
.. py:method:: dagma.locally_connected.LocallyConnected._register_state_dict_hook(hook)

   These hooks will be called with arguments: `self`, `state_dict`,
   `prefix`, `local_metadata`, after the `state_dict` of `self` is set.
   Note that only parameters and buffers of `self` or its children are
   guaranteed to exist in `state_dict`. The hooks may modify `state_dict`
   inplace or return a new one.




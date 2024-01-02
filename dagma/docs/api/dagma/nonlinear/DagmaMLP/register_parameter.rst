:py:meth:`dagma.nonlinear.DagmaMLP.register_parameter <dagma.nonlinear.DagmaMLP.register_parameter>`
====================================================================================================
.. _dagma.nonlinear.DagmaMLP.register_parameter:
.. py:method:: dagma.nonlinear.DagmaMLP.register_parameter(name: str, param: Optional[torch.nn.parameter.Parameter]) -> None

   Adds a parameter to the module.

   The parameter can be accessed as an attribute using given name.

   :param name: name of the parameter. The parameter can be accessed
                from this module using the given name
   :type name: str
   :param param: parameter to be added to the module. If
                 ``None``, then operations that run on parameters, such as :attr:`cuda`,
                 are ignored. If ``None``, the parameter is **not** included in the
                 module's :attr:`state_dict`.
   :type param: Parameter or None




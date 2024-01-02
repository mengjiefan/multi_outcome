{% if obj.display %}
:py:class:`{{ obj.id }} <{{ obj.id }}>`
==========={{ "=" * 2 * (obj.id|length + 2) }}

.. _{{ obj.id }}:

.. py:{{ obj.type }}:: {{ obj.id }}{% if obj.args %}({{ obj.args }}){% endif %}

{% for (args, return_annotation) in obj.overloads %}
      {{ " " * (obj.type | length) }}   {{ obj.id }}{% if args %}({{ args }}){% endif %}

{% endfor %}


   {% if obj.bases %}
   {% if "show-inheritance" in autoapi_options %}
   Bases: {% for base in obj.bases %}{{ base|link_objs }}{% if not loop.last %}, {% endif %}{% endfor %}
   {% endif %}


   {% if "show-inheritance-diagram" in autoapi_options and obj.bases != ["object"] %}
   .. autoapi-inheritance-diagram:: {{ obj.obj["full_name"] }}
      :parts: 1
      {% if "private-members" in autoapi_options %}
      :private-bases:
      {% endif %}

   {% endif %}
   {% endif %}
   {% if obj.docstring %}
   {{ obj.docstring|indent(3) }}
   {% endif %}
   {% if "inherited-members" in autoapi_options %}
   {% set visible_classes = obj.classes|selectattr("display")|list %}
   {% else %}
   {% set visible_classes = obj.classes|rejectattr("inherited")|selectattr("display")|list %}
   {% endif %}
   {% for klass in visible_classes %}
   {{ klass.render()|indent(3) }}
   {% endfor %}
   {% if "inherited-members" in autoapi_options %}
   {% set visible_properties = obj.properties|selectattr("display")|list %}
   {% else %}
   {% set visible_properties = obj.properties|rejectattr("inherited")|selectattr("display")|list %}
   {% endif %}
   {% for property in visible_properties %}
   {{ property.render()|indent(3) }}
   {% endfor %}
   {% if "inherited-members" in autoapi_options %}
   {% set visible_attributes = obj.attributes|selectattr("display")|list %}
   {% else %}
   {% set visible_attributes = obj.attributes|rejectattr("inherited")|selectattr("display")|list %}
   {% endif %}
   {% for attribute in visible_attributes %}
   {{ attribute.render()|indent(3) }}
   {% endfor %}
   {% if "inherited-members" in autoapi_options %}
   {% set visible_methods = obj.methods|selectattr("display")|list %}
   {% else %}
   {% set visible_methods = obj.methods|rejectattr("inherited")|selectattr("display")|list %}
   {% endif %}
   Methods
   ~~~~~~~

   .. autoapisummary::

    {% for method in visible_methods %}
      {{ method.id }}
    {% endfor %}

.. toctree::
   :maxdepth: 2
   :hidden:

{% for method in visible_methods %}
   {{ method.short_name }}<{{ method.short_name }}>
{% endfor %}

{% endif %}

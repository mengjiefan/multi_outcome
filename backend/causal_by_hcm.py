

# if __name__ == '__main__':
#     df = pd.read_csv(args.data_file)
#     if args.skl_file == "":
#         selMat = None
#     else:
#         selMat = pd.read_csv(args.skl_file, header=None).values > 0
#     print(df.columns)
#     print(df.columns.values)
#     model_para_out, base_model_para_out = check_model_para(
#         args.model_para, args.base_model, args.base_model_para)

#     df, X_encode = data_processing(df, args.cat_index, normalize='biweight')
#     prior_adj, prior_anc = prior_knowledge_encode(
#         feature_names=df.columns, source_nodes=args.source_nodes,
#         direct_edges=args.direct_edges, not_direct_edges=args.not_direct_edges)

#     selMat, dag2, dag, step1_time, step2_time, step3_time = mixed_causal(
#         df, X_encode, model_para= model_para_out,
#         prior_adj=prior_adj, prior_anc=prior_anc,
#         base_model_para=base_model_para_out, selMat=selMat)
#     print(step1_time, step2_time, step3_time)
#     # np.savetxt(args.data_file[:-4]+'_skl.csv', selMat, delimiter=",")
#     np.savetxt(args.data_file[:-4]+'_dag2.csv', dag2, delimiter=",")
#     np.savetxt(args.data_file[:-4]+'_dag.csv', dag, delimiter=",")
#     if args.true_G != '':
#         trueG = pd.read_csv(args.true_G).values
#         skl_result, dag2_result, dag_result = evaluate(trueG, selMat, dag2,dag)
#         print(skl_result)
#         print(dag2_result)
#         print(dag_result)
#         #print(trueG)
#         #print(dag)
